import { collection, query, orderBy, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import useAuthStore from '../../store/authStore';

/** 일지 목록 조회 (날짜 내림차순, Firestore) */
export async function fetchReports(projectId) {
  const q = query(collection(db, `projects/${projectId}/reports`), orderBy('reportDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/** 일지 상세 조회 */
export async function fetchReport(projectId, reportId) {
  const reportRef = doc(db, `projects/${projectId}/reports`, String(reportId));
  const snap = await getDoc(reportRef);
  if (!snap.exists()) throw new Error('일지를 찾을 수 없습니다.');

  // 하위 Report Items 가져오기
  const itemsQ = query(collection(db, `projects/${projectId}/reports/${reportId}/items`));
  const itemsSnap = await getDocs(itemsQ);
  const items = itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 하위 photos / blueprints 가져오기 (서브켼렉션 방식)
  const photosSnap = await getDocs(query(
    collection(db, `projects/${projectId}/reports/${reportId}/photos`),
    orderBy('createdAt', 'asc')
  ));
  const blueprintsSnap = await getDocs(query(
    collection(db, `projects/${projectId}/reports/${reportId}/blueprints`),
    orderBy('createdAt', 'asc')
  ));
  const photos = photosSnap.docs.map(d => d.data().data);
  const blueprints = blueprintsSnap.docs.map(d => d.data().data);

  return { id: snap.id, ...snap.data(), items, photos, blueprints };
}

/**
 * 일지에 소공정 항목 추가 (Upsert 방식)
 * - 오늘 날짜의 report가 이미 있으면 해당 report에 item만 추가
 * - 없으면 새 report를 생성하고 item 추가
 * - 동일 소공정은 중복 추가하지 않음
 * - memoSnapshot은 항상 빈값 (메모는 일지 안에서 별도 작성)
 * @param {string} projectId
 * @param {{ reportDate: string, weather: string, minorProcessIds: string[] }} payload
 */
export async function createReport(projectId, payload) {
  // 1. 오늘 날짜 report가 이미 존재하는지 확인
  const existingQ = query(
    collection(db, `projects/${projectId}/reports`),
    where('reportDate', '==', payload.reportDate)
  );
  const existingSnap = await getDocs(existingQ);

  let reportId;
  if (!existingSnap.empty) {
    // 기존 오늘 report 재사용 — 새 문서를 만들지 않는다
    reportId = existingSnap.docs[0].id;
  } else {
    // 오늘 report가 없으면 새로 생성
    const reportRef = doc(collection(db, `projects/${projectId}/reports`));
    await setDoc(reportRef, {
      reportDate: payload.reportDate,
      weather: payload.weather,
      authorName: useAuthStore.getState().name || '담당자',
      additionalMemo: '',
      createdAt: new Date().toISOString()
    });
    reportId = reportRef.id;
  }

  // 2. 선택된 소공정을 items 하위 컬렉션에 추가
  for (const minorId of payload.minorProcessIds) {
    const mSnap = await getDoc(doc(db, `projects/${projectId}/minor_processes`, String(minorId)));
    if (!mSnap.exists()) continue;
    const minor = { id: mSnap.id, ...mSnap.data() };

    // 동일 소공정 중복 추가 방지
    const dupQ = query(
      collection(db, `projects/${projectId}/reports/${reportId}/items`),
      where('minorProcessId', '==', minor.id)
    );
    const dupSnap = await getDocs(dupQ);
    if (!dupSnap.empty) continue; // 이미 있으면 스킵

    const itemRef = doc(collection(db, `projects/${projectId}/reports/${reportId}/items`));
    await setDoc(itemRef, {
      minorProcessId: minor.id,
      nameSnapshot: minor.name,    // Report.jsx: item.nameSnapshot
      statusSnapshot: minor.status, // Report.jsx: item.statusSnapshot
      memoSnapshot: ''              // 메모는 빈값으로 — 일지 안에서 별도 작성
    });
  }

  return { id: reportId };
}

/**
 * 오늘 날짜 보고서 조회 — 없으면 null 반환
 * where 쿼리로 서버 단 필터링 (전체 조회 후 클라이언트 필터 제거)
 */
export async function fetchTodayReport(projectId) {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(
    collection(db, `projects/${projectId}/reports`),
    where('reportDate', '==', today)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return fetchReport(projectId, snapshot.docs[0].id);
}

/** 
 * 대시보드에서 일지 항목 제거 
 * - 오늘 날짜 보고서에서 해당 minorProcessId를 가진 항목을 찾아 삭제
 */
export async function removeMinorFromTodayReport(projectId, minorId) {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(
    collection(db, `projects/${projectId}/reports`),
    where('reportDate', '==', today)
  );
  const reportSnap = await getDocs(q);
  if (reportSnap.empty) return; // 오늘 일지가 없으면 무시

  const reportId = reportSnap.docs[0].id;
  const itemQ = query(
    collection(db, `projects/${projectId}/reports/${reportId}/items`),
    where('minorProcessId', '==', String(minorId))
  );
  const itemSnap = await getDocs(itemQ);

  for (const itemDoc of itemSnap.docs) {
    await deleteDoc(doc(db, `projects/${projectId}/reports/${reportId}/items`, itemDoc.id));
  }
}

/**
 * 보고서 저장 — 메모는 report 문서에, 사진/도면은 서브켼렉션에 개별 문서로 분산 저장
 * - 각 사진은 photos/{photoId} 문서에 { data: base64 } 형태
 * - Firestore 먹스당 1MB 제한을 비켜갈 수 있음 (= Base64 앞섛 n장 가능)
 */
export async function saveReport(projectId, reportId, { additionalMemo, photos = [], blueprints = [] }) {
  // 1. 본문: 메모만 업데이트
  const reportRef = doc(db, `projects/${projectId}/reports`, String(reportId));
  await updateDoc(reportRef, { additionalMemo: additionalMemo ?? '' });

  // 2. 기존 photos 서브컴렉션 전체 삭제 후 다시 저장
  const photosCol = collection(db, `projects/${projectId}/reports/${reportId}/photos`);
  const oldPhotos = await getDocs(photosCol);
  for (const d of oldPhotos.docs) await deleteDoc(d.ref);
  for (const data of photos) {
    await setDoc(doc(photosCol), { data, createdAt: new Date().toISOString() });
  }

  // 3. 기존 blueprints 서브컴렉션 전체 삭제 후 다시 저장
  const bpsCol = collection(db, `projects/${projectId}/reports/${reportId}/blueprints`);
  const oldBps = await getDocs(bpsCol);
  for (const d of oldBps.docs) await deleteDoc(d.ref);
  for (const data of blueprints) {
    await setDoc(doc(bpsCol), { data, createdAt: new Date().toISOString() });
  }
}

/** 보고서 추가 메모만 수정 (하위 호환용 — 내부적으로 saveReport 호출) */
export async function updateAdditionalMemo(projectId, reportId, memo) {
  await saveReport(projectId, reportId, { additionalMemo: memo });
}

/** 보고서 항목 메모 수정 — memoSnapshot 필드로 통일 */
export async function updateReportItemMemo(projectId, reportId, itemId, memo) {
  const itemRef = doc(db, `projects/${projectId}/reports/${reportId}/items`, String(itemId));
  await updateDoc(itemRef, { memoSnapshot: memo });
}

/**
 * 보고서 항목 상태 수정 — statusSnapshot 필드만 업데이트
 * 체크리스트/대시보드의 전역 소공정 상태(minor_processes)와 완전히 분리
 * 일지는 일지만의 독립 상태를 가짐
 */
export async function updateReportItemStatus(projectId, reportId, itemId, newStatus) {
  const itemRef = doc(db, `projects/${projectId}/reports/${reportId}/items`, String(itemId));
  await updateDoc(itemRef, { statusSnapshot: newStatus });
}



/** 보고서 항목 삭제 — 일지에서 공정 항목 제거 */
export async function deleteReportItem(projectId, reportId, itemId) {
  const itemRef = doc(db, `projects/${projectId}/reports/${reportId}/items`, String(itemId));
  await deleteDoc(itemRef);
}

/** 보고서(일지) 전체 삭제 */
export async function deleteReport(projectId, reportId) {
  // 1. 하위 items 삭제
  const itemsQ = query(collection(db, `projects/${projectId}/reports/${reportId}/items`));
  const itemsSnap = await getDocs(itemsQ);
  for (const itemDoc of itemsSnap.docs) {
    await deleteDoc(doc(db, `projects/${projectId}/reports/${reportId}/items`, itemDoc.id));
  }
  // 2. 일지 본문 삭제
  const reportRef = doc(db, `projects/${projectId}/reports`, String(reportId));
  await deleteDoc(reportRef);
}
