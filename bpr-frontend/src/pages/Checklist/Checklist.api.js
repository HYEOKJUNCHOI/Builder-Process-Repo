import { collection, query, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';

/** 체크리스트 전체 조회 (Firestore) */
export async function fetchChecklist(projectId) {
  // 1. 대공정 (major) 조회
  const majorQ = query(collection(db, `projects/${projectId}/major_processes`), orderBy('createdAt', 'asc'));
  const majorSnap = await getDocs(majorQ);
  const majorProcesses = majorSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), minorProcesses: [] }));

  // 2. 소공정 (minor) 조회
  const minorQ = query(collection(db, `projects/${projectId}/minor_processes`), orderBy('createdAt', 'asc'));
  const minorSnap = await getDocs(minorQ);
  const allMinors = minorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 3. 오늘 일지 조회하여 '이미 담긴' 항목 판별
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

  // 4. 병합 시 isReported 플래그 추가
  majorProcesses.forEach(major => {
    major.minorProcesses = allMinors
      .filter(minor => minor.majorId === major.id)
      .map(minor => ({
        ...minor,
        isReported: reportedMinorIds.has(minor.id)
      }));
  });

  return { majorProcesses };
}

/** 소공정 상태 순환 (WAITING → IN_PROGRESS → TOUCH_UP → DONE → WAITING) */
export async function cycleStatus(projectId, minorId, currentStatus) {
  const STATUS_CYCLE = {
    WAITING: 'IN_PROGRESS',
    IN_PROGRESS: 'TOUCH_UP',
    TOUCH_UP: 'DONE',
    DONE: 'WAITING',
  };
  const nextStatus = STATUS_CYCLE[currentStatus] || 'WAITING';

  // 1. 소공정 상태 업데이트
  const minorRef = doc(db, `projects/${projectId}/minor_processes`, String(minorId));
  await updateDoc(minorRef, { status: nextStatus, updatedAt: new Date().toISOString() });

  // 2. 오늘 날짜 report가 있으면 해당 item의 statusSnapshot도 동기화 (전역 동기화)
  const today = new Date().toISOString().slice(0, 10);
  const todayReportQ = query(
    collection(db, `projects/${projectId}/reports`),
    where('reportDate', '==', today)
  );
  const todayReportSnap = await getDocs(todayReportQ);

  if (!todayReportSnap.empty) {
    const reportId = todayReportSnap.docs[0].id;
    const itemQ = query(
      collection(db, `projects/${projectId}/reports/${reportId}/items`),
      where('minorProcessId', '==', String(minorId))
    );
    const itemSnap = await getDocs(itemQ);
    for (const itemDoc of itemSnap.docs) {
      await updateDoc(
        doc(db, `projects/${projectId}/reports/${reportId}/items`, itemDoc.id),
        { statusSnapshot: nextStatus }
      );
    }
  }

  return nextStatus;
}

/**
 * 소공정 상태 초기화 — WAITING으로 직접 리셋
 * cycleStatus는 순환만 가능하므로 취소(초기화) 용도로 별도 분리
 */
export async function resetMinorStatus(projectId, minorId) {
  const minorRef = doc(db, `projects/${projectId}/minor_processes`, String(minorId));
  await updateDoc(minorRef, { status: 'WAITING', updatedAt: new Date().toISOString() });

  // 오늘 일지에 해당 항목이 있으면 statusSnapshot도 함께 초기화
  const today = new Date().toISOString().slice(0, 10);
  const todayReportQ = query(
    collection(db, `projects/${projectId}/reports`),
    where('reportDate', '==', today)
  );
  const todayReportSnap = await getDocs(todayReportQ);
  if (!todayReportSnap.empty) {
    const reportId = todayReportSnap.docs[0].id;
    const itemQ = query(
      collection(db, `projects/${projectId}/reports/${reportId}/items`),
      where('minorProcessId', '==', String(minorId))
    );
    const itemSnap = await getDocs(itemQ);
    for (const itemDoc of itemSnap.docs) {
      await updateDoc(
        doc(db, `projects/${projectId}/reports/${reportId}/items`, itemDoc.id),
        { statusSnapshot: 'WAITING' }
      );
    }
  }
}

/** 오늘 할 일 토글 */
export async function toggleToday(projectId, minorId, currentIsToday) {
  const minorRef = doc(db, `projects/${projectId}/minor_processes`, String(minorId));
  await updateDoc(minorRef, { isToday: !currentIsToday, updatedAt: new Date().toISOString() });
  return !currentIsToday;
}

/** 소공정 메모 수정 */
export async function updateMinorMemo(projectId, minorId, memo) {
  const minorRef = doc(db, `projects/${projectId}/minor_processes`, String(minorId));
  await updateDoc(minorRef, { memo, updatedAt: new Date().toISOString() });
}

/** 대공정 추가 */
export async function addMajorProcess(projectId, name) {
  const majorRef = doc(collection(db, `projects/${projectId}/major_processes`));
  await setDoc(majorRef, {
    name,
    createdAt: new Date().toISOString()
  });
}

/** 소공정 추가 */
export async function addMinorProcess(projectId, majorId, name, memo) {
  const minorRef = doc(collection(db, `projects/${projectId}/minor_processes`));
  const payload = {
    majorId,
    name,
    status: 'WAITING',
    isToday: false,
    createdAt: new Date().toISOString()
  };
  if (memo && memo.trim()) payload.memo = memo.trim();

  await setDoc(minorRef, payload);
}

/** 대공정 삭제 */
export async function deleteMajorProcess(projectId, majorId) {
  await deleteDoc(doc(db, `projects/${projectId}/major_processes`, String(majorId)));
  // 참고: 실제로는 Firestore 트리거 또는 배치 삭제를 통해 하위 소공정도 같이 지워줘야 합니다.
  // 프론트엔드에서는 우선 대공정 삭제만 호출합니다.
}

/** 소공정 삭제 */
export async function deleteMinorProcess(projectId, minorId) {
  await deleteDoc(doc(db, `projects/${projectId}/minor_processes`, String(minorId)));
}

/** 현장 정보 수정 (이름/주소/착공일/준공예정일) */
export async function updateProject(projectId, payload) {
  const projectRef = doc(db, 'projects', String(projectId));
  await updateDoc(projectRef, { ...payload, updatedAt: new Date().toISOString() });

  const updatedSnap = await getDoc(projectRef);
  return { id: updatedSnap.id, ...updatedSnap.data() };
}

/** 현장 삭제 */
export async function deleteProject(projectId) {
  await deleteDoc(doc(db, 'projects', String(projectId)));
}
