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

/** 소공정 상태 순환 (WAITING → IN_PROGRESS → TOUCH_UP → DONE → WAITING)
 *  일지 스냅샷은 건드리지 않음 — 스냅샷은 담은 시점에 고정 */
export async function cycleStatus(projectId, minorId, currentStatus) {
  const STATUS_CYCLE = {
    WAITING: 'IN_PROGRESS',
    IN_PROGRESS: 'TOUCH_UP',
    TOUCH_UP: 'DONE',
    DONE: 'WAITING',
  };
  const nextStatus = STATUS_CYCLE[currentStatus] || 'WAITING';

  const minorRef = doc(db, `projects/${projectId}/minor_processes`, String(minorId));
  await updateDoc(minorRef, { status: nextStatus, updatedAt: new Date().toISOString() });

  return nextStatus;
}

/**
 * 소공정 상태 초기화 — WAITING으로 직접 리셋
 * 일지 스냅샷은 건드리지 않음 (스냅샷은 담은 시점에 고정)
 */
export async function resetMinorStatus(projectId, minorId) {
  const minorRef = doc(db, `projects/${projectId}/minor_processes`, String(minorId));
  await updateDoc(minorRef, { status: 'WAITING', updatedAt: new Date().toISOString() });
}

/** 소공정 상태 직접 지정 — 일지 스냅샷은 건드리지 않음 (스냅샷은 담은 시점에 고정) */
export async function setMinorStatus(projectId, minorId, newStatus) {
  const minorRef = doc(db, `projects/${projectId}/minor_processes`, String(minorId));
  await updateDoc(minorRef, { status: newStatus, updatedAt: new Date().toISOString() });
  return newStatus;
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

/** 대공정 삭제 (캐스케이드) — 하위 소공정까지 일괄 삭제
 *  단, 일지(report items)는 당일 작업 기록이므로 삭제하지 않음.
 *  사용자가 일지 페이지에서 직접 ✕ 버튼으로 제거할 수 있음. */
export async function deleteMajorProcess(projectId, majorId) {
  // 1. 해당 대공정 소속 소공정 목록 수집
  const minorQ = query(
    collection(db, `projects/${projectId}/minor_processes`),
    where('majorId', '==', String(majorId))
  );
  const minorSnap = await getDocs(minorQ);

  // 2. 소공정 전체 삭제
  for (const minorDoc of minorSnap.docs) {
    await deleteDoc(doc(db, `projects/${projectId}/minor_processes`, minorDoc.id));
  }

  // 3. 대공정 삭제
  await deleteDoc(doc(db, `projects/${projectId}/major_processes`, String(majorId)));
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

/** 소공정 순서 변경 — createdAt 값을 두 항목 사이에 교환하여 정렬 순서 바꿈 */
export async function reorderMinorProcess(projectId, id1, createdAt1, id2, createdAt2) {
  const ref1 = doc(db, `projects/${projectId}/minor_processes`, id1);
  const ref2 = doc(db, `projects/${projectId}/minor_processes`, id2);
  await updateDoc(ref1, { createdAt: createdAt2 });
  await updateDoc(ref2, { createdAt: createdAt1 });
}

/** 대공정 순서 변경 — createdAt 값을 두 항목 사이에 교환하여 정렬 순서 바꿈 */
export async function reorderMajorProcess(projectId, id1, createdAt1, id2, createdAt2) {
  const ref1 = doc(db, `projects/${projectId}/major_processes`, id1);
  const ref2 = doc(db, `projects/${projectId}/major_processes`, id2);
  await updateDoc(ref1, { createdAt: createdAt2 });
  await updateDoc(ref2, { createdAt: createdAt1 });
}
