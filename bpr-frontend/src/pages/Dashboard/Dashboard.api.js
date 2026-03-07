import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
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
  const today = new Date().toISOString().slice(0, 10);
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
