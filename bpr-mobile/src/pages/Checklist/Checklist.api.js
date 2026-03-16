import {
  collection, query, getDocs, doc, updateDoc,
  deleteDoc, setDoc, getDoc, orderBy, where,
} from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';

/** 체크리스트 전체 조회 (대공정 → 소공정 병합) */
export async function fetchChecklist(projectId) {
  // 1. 대공정 조회
  const majorQ = query(
    collection(db, `projects/${projectId}/major_processes`),
    orderBy('createdAt', 'asc'),
  );
  const majorSnap = await getDocs(majorQ);
  const majorProcesses = majorSnap.docs.map(d => ({
    id: d.id, ...d.data(), minorProcesses: [],
  }));

  // 2. 소공정 조회
  const minorQ = query(
    collection(db, `projects/${projectId}/minor_processes`),
    orderBy('createdAt', 'asc'),
  );
  const minorSnap = await getDocs(minorQ);
  const allMinors = minorSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 3. 오늘 일지 reportedIds 수집 (일지 담기 여부 표시용)
  const today = new Date().toLocaleDateString('sv-SE');
  const todayRQ = query(
    collection(db, `projects/${projectId}/reports`),
    where('reportDate', '==', today),
  );
  const todayRSnap = await getDocs(todayRQ);
  const reportedMinorIds = new Set();
  if (!todayRSnap.empty) {
    const reportId = todayRSnap.docs[0].id;
    const itemsSnap = await getDocs(
      collection(db, `projects/${projectId}/reports/${reportId}/items`),
    );
    itemsSnap.docs.forEach(d => reportedMinorIds.add(d.data().minorProcessId));
  }

  // 4. 소공정을 대공정에 병합
  majorProcesses.forEach(major => {
    major.minorProcesses = allMinors
      .filter(m => m.majorId === major.id)
      .map(m => ({ ...m, isReported: reportedMinorIds.has(m.id) }));
  });

  return { majorProcesses };
}

/** 소공정 상태 직접 지정 */
export async function setMinorStatus(projectId, minorId, newStatus) {
  const ref = doc(db, `projects/${projectId}/minor_processes`, minorId);
  await updateDoc(ref, { status: newStatus, updatedAt: new Date().toISOString() });
}

/** 소공정 상태 순환 */
export async function cycleStatus(projectId, minorId, currentStatus) {
  const CYCLE = { WAITING: 'IN_PROGRESS', IN_PROGRESS: 'TOUCH_UP', TOUCH_UP: 'DONE', DONE: 'WAITING' };
  const next = CYCLE[currentStatus] ?? 'WAITING';
  const ref = doc(db, `projects/${projectId}/minor_processes`, minorId);
  await updateDoc(ref, { status: next, updatedAt: new Date().toISOString() });
  return next;
}

/** 오늘 할 일 토글 */
export async function toggleToday(projectId, minorId, currentIsToday) {
  const ref = doc(db, `projects/${projectId}/minor_processes`, minorId);
  await updateDoc(ref, { isToday: !currentIsToday, updatedAt: new Date().toISOString() });
}

/** 소공정 메모 수정 */
export async function updateMinorMemo(projectId, minorId, memo) {
  const ref = doc(db, `projects/${projectId}/minor_processes`, minorId);
  await updateDoc(ref, { memo, updatedAt: new Date().toISOString() });
}

/** 대공정 추가 */
export async function addMajorProcess(projectId, name) {
  const ref = doc(collection(db, `projects/${projectId}/major_processes`));
  await setDoc(ref, { name, createdAt: new Date().toISOString() });
}

/** 소공정 추가 */
export async function addMinorProcess(projectId, majorId, name, memo) {
  const ref = doc(collection(db, `projects/${projectId}/minor_processes`));
  const payload = {
    majorId, name, status: 'WAITING', isToday: false,
    createdAt: new Date().toISOString(),
  };
  if (memo?.trim()) payload.memo = memo.trim();
  await setDoc(ref, payload);
}

/** 대공정 삭제 (하위 소공정 포함) */
export async function deleteMajorProcess(projectId, majorId) {
  const minorQ = query(
    collection(db, `projects/${projectId}/minor_processes`),
    where('majorId', '==', majorId),
  );
  const snap = await getDocs(minorQ);
  for (const d of snap.docs) {
    await deleteDoc(doc(db, `projects/${projectId}/minor_processes`, d.id));
  }
  await deleteDoc(doc(db, `projects/${projectId}/major_processes`, majorId));
}

/** 소공정 삭제 */
export async function deleteMinorProcess(projectId, minorId) {
  await deleteDoc(doc(db, `projects/${projectId}/minor_processes`, minorId));
}

/**
 * 대공정 전체 순서 재정렬 — DraggableFlatList onDragEnd 결과 적용
 * 드래그 후 새 배열을 받아 모든 항목의 createdAt을 순서대로 갱신
 */
export async function reorderAllMajors(projectId, orderedItems) {
  const base = Date.now();
  for (let i = 0; i < orderedItems.length; i++) {
    const ref = doc(db, `projects/${projectId}/major_processes`, orderedItems[i].id);
    await updateDoc(ref, { createdAt: new Date(base + i * 100).toISOString() });
  }
}

/**
 * 소공정 전체 순서 재정렬 — DraggableFlatList onDragEnd 결과 적용
 * 드래그 후 새 배열을 받아 해당 대공정 소속 소공정 순서를 갱신
 */
export async function reorderAllMinors(projectId, orderedItems) {
  const base = Date.now();
  for (let i = 0; i < orderedItems.length; i++) {
    const ref = doc(db, `projects/${projectId}/minor_processes`, orderedItems[i].id);
    await updateDoc(ref, { createdAt: new Date(base + i * 100).toISOString() });
  }
}
