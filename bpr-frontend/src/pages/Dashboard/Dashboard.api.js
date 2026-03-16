import { collection, query, where, orderBy, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../utils/firebaseConfig';
import useAuthStore from '../../store/authStore';

/**
 * 내 현장 목록 조회 (Firestore)
 * @returns {Array<{ id, name, address, startDate, endDate }>}
 */
export async function fetchMyProjects() {
  const userId = useAuthStore.getState().userId;
  if (!userId) return [];

  const q = query(collection(db, 'projects'), where('ownerId', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * 오늘 할 일 목록 조회 (Firestore)
 * - is_today = true 인 소공정 반환
 * @param {string} projectId
 * @returns {{ projectName, todayTasks: Array<{ id, majorName, name, status, memo }> }}
 */
export async function fetchDashboard(projectId) {
  // 프로젝트 정보 가져오기
  const projectRef = doc(db, 'projects', String(projectId));
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error('프로젝트를 찾을 수 없습니다.');
  }

  // 오늘 할 일 (isToday == true 인 소공정) 찾기
  const q = query(
    collection(db, `projects/${projectId}/minor_processes`),
    where('isToday', '==', true)
  );

  const todayTasksSnap = await getDocs(q);
  // 전체 소공정 가져와서 진척도 계산용 데이터 추출
  const minorQ = query(collection(db, `projects/${projectId}/minor_processes`));
  const minorSnap = await getDocs(minorQ);

  let totalMinorCount = 0;
  let doneMinorCount = 0;

  minorSnap.docs.forEach(doc => {
    totalMinorCount++;
    if (doc.data().status === 'DONE') {
      doneMinorCount++;
    }
  });

  // Fetch all major processes to map major names
  const majorQ = query(collection(db, `projects/${projectId}/major_processes`));
  const majorSnap = await getDocs(majorQ);
  const majorMap = {};
  majorSnap.docs.forEach(doc => {
    majorMap[doc.id] = doc.data().name;
  });

  // 오늘 일지 항목 조회하여 이미 일지에 담긴 소공정 ID 추출
  const today = new Date().toLocaleDateString('sv-SE');
  const todayReportQ = query(
    collection(db, `projects/${projectId}/reports`),
    where('reportDate', '==', today)
  );
  const todayReportSnap = await getDocs(todayReportQ);

  const reportedMinorIds = new Set();
  if (!todayReportSnap.empty) {
    const reportId = todayReportSnap.docs[0].id;
    const itemsQ = query(collection(db, `projects/${projectId}/reports/${reportId}/items`));
    const itemsSnap = await getDocs(itemsQ);
    itemsSnap.docs.forEach(doc => {
      reportedMinorIds.add(doc.data().minorProcessId);
    });
  }

  const todayTasks = todayTasksSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      minorProcessName: data.name,
      majorProcessName: majorMap[data.majorId] || '기타',
      isReported: reportedMinorIds.has(doc.id),
      ...data
    };
  });

  const projectData = projectSnap.data();

  return {
    projectName: projectData.name,
    startDate: projectData.startDate,
    endDate: projectData.endDate,
    totalMinorCount,
    doneMinorCount,
    todayTasks
  };
}

/**
 * 현장 생성 (Firestore)
 * @param {{ name, address, lat, lng, startDate, endDate, templateId? }} payload
 */
export async function createProject(payload) {
  const userId = useAuthStore.getState().userId;
  const newProjectRef = doc(collection(db, 'projects'));

  const newProject = {
    name: payload.name,
    address: payload.address || null,
    startDate: payload.startDate,
    endDate: payload.endDate,
    templateId: payload.templateId || null,
    ownerId: userId,
    createdAt: new Date().toISOString()
  };

  await setDoc(newProjectRef, newProject);

  // 템플릿이 선택된 경우, 템플릿 공정을 복사
  if (payload.templateId) {
    const templateRef = doc(db, 'templates', String(payload.templateId));
    const templateSnap = await getDoc(templateRef);

    if (templateSnap.exists()) {
      // 1. 템플릿의 대공정 목록 가져오기
      const majorsQ = query(collection(db, `templates/${payload.templateId}/template_major_processes`));
      const majorsSnap = await getDocs(majorsQ);

      for (const tMajorDoc of majorsSnap.docs) {
        // 새 프로젝트의 대공정으로 복사
        const newMajorRef = doc(collection(db, `projects/${newProjectRef.id}/major_processes`));
        await setDoc(newMajorRef, {
          name: tMajorDoc.data().name,
          displayOrder: tMajorDoc.data().displayOrder,
          createdAt: new Date().toISOString()
        });

        // 2. 해당 대공정의 소공정 목록 가져오기
        const minorsQ = query(collection(db, `templates/${payload.templateId}/template_major_processes/${tMajorDoc.id}/template_minor_processes`));
        const minorsSnap = await getDocs(minorsQ);

        for (const tMinorDoc of minorsSnap.docs) {
          // 새 프로젝트의 소공정으로 복사
          const newMinorRef = doc(collection(db, `projects/${newProjectRef.id}/minor_processes`));
          await setDoc(newMinorRef, {
            majorId: newMajorRef.id,
            name: tMinorDoc.data().name,
            status: 'WAITING',
            isToday: false,
            memo: '',
            displayOrder: tMinorDoc.data().displayOrder,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  }

  return { id: newProjectRef.id, ...newProject };
}

/**
 * 템플릿 목록 조회 (Firestore)
 */
export async function fetchTemplates() {
  const snapshot = await getDocs(collection(db, 'templates'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * 현재 현장의 공정 구조를 공정 레퍼런스(템플릿)로 저장
 * - 배지 상태(status)는 모두 대기(WAITING)로 초기화되어 저장됨
 * - 구조: templates/{id}/template_major_processes/{id}/template_minor_processes/{id}
 * @param {string} projectId
 * @param {string} templateName - 저장할 템플릿 이름
 */
export async function saveProjectAsTemplate(projectId, templateName) {
  // 1. 새 템플릿 문서 생성
  const templateRef = doc(collection(db, 'templates'));
  await setDoc(templateRef, {
    name: templateName,
    createdAt: new Date().toISOString(),
  });

  // 2. 대공정 목록 조회 (생성 순서 유지)
  const majorSnap = await getDocs(
    query(collection(db, `projects/${projectId}/major_processes`), orderBy('createdAt', 'asc'))
  );

  for (let i = 0; i < majorSnap.docs.length; i++) {
    const majorDoc = majorSnap.docs[i];

    // 3. template_major_processes에 복사
    const tMajorRef = doc(collection(db, `templates/${templateRef.id}/template_major_processes`));
    await setDoc(tMajorRef, {
      name: majorDoc.data().name,
      displayOrder: i,
      createdAt: new Date().toISOString(),
    });

    // 4. 해당 대공정의 소공정 조회 → template_minor_processes에 복사
    //    where + orderBy 복합 쿼리는 Firestore 복합 인덱스가 필요하므로
    //    where만 사용하고 createdAt 기준 정렬은 클라이언트에서 처리
    const minorSnap = await getDocs(
      query(
        collection(db, `projects/${projectId}/minor_processes`),
        where('majorId', '==', majorDoc.id)
      )
    );
    // 생성 순서 유지: createdAt 기준 오름차순 클라이언트 정렬 (docs는 readonly → 복사 후 정렬)
    const sortedMinors = [...minorSnap.docs].sort((a, b) =>
      (a.data().createdAt ?? '').localeCompare(b.data().createdAt ?? '')
    );

    for (let j = 0; j < sortedMinors.length; j++) {
      const minorDoc = sortedMinors[j];
      const minorData = minorDoc.data();
      await setDoc(
        doc(collection(db, `templates/${templateRef.id}/template_major_processes/${tMajorRef.id}/template_minor_processes`)),
        {
          name: minorData.name,
          memo: minorData.memo ?? '',
          displayOrder: j,
          createdAt: new Date().toISOString(),
        }
      );
    }
  }

  return templateRef.id;
}

/**
 * 템플릿 삭제 — 템플릿 문서와 하위 대공정/소공정 서브컬렉션 전체 제거
 * @param {string} templateId
 */
export async function deleteTemplate(templateId) {
  // 1. 하위 대공정 목록 조회
  const majorsSnap = await getDocs(
    collection(db, `templates/${templateId}/template_major_processes`)
  );

  for (const majorDoc of majorsSnap.docs) {
    // 2. 소공정 목록 조회 후 삭제
    const minorsSnap = await getDocs(
      collection(db, `templates/${templateId}/template_major_processes/${majorDoc.id}/template_minor_processes`)
    );
    for (const minorDoc of minorsSnap.docs) {
      await deleteDoc(minorDoc.ref);
    }
    // 3. 대공정 삭제
    await deleteDoc(majorDoc.ref);
  }

  // 4. 템플릿 문서 삭제
  await deleteDoc(doc(db, 'templates', String(templateId)));
}

/**
 * 템플릿 썸네일 이미지 업로드 + Firestore imageUrl 저장
 * @param {string} templateId
 * @param {File}   file         - input[type=file] 에서 받은 파일 객체
 * @returns {string} 다운로드 URL
 */
export async function uploadTemplateImage(templateId, file) {
  // Firebase Storage에 templates/{id}/thumbnail 경로로 저장
  const imgRef = storageRef(storage, `templates/${templateId}/thumbnail`);
  await uploadBytes(imgRef, file);
  const downloadUrl = await getDownloadURL(imgRef);

  // Firestore 템플릿 문서에 imageUrl 필드 업데이트
  await updateDoc(doc(db, 'templates', String(templateId)), { imageUrl: downloadUrl });

  return downloadUrl;
}
