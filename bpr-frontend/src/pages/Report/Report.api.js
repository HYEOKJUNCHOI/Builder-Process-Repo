import { collection, query, orderBy, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import useAuthStore from '../../store/authStore';

/** 일지 목록 조회 (날짜 내림차순, Firestore) */
export async function fetchReports(projectId) {
  const q = query(collection(db, `projects/${projectId}/reports`), orderBy('reportDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * 일지 상세 조회
 * @param {boolean} useSnapshot - true: itemsData 필드 우선 사용 (불러오기/상세 보기용)
 *                                false: 서브컬렉션 사용 (오늘 일지 실시간 상태용)
 */
export async function fetchReport(projectId, reportId, { useSnapshot = false } = {}) {
  const reportRef = doc(db, `projects/${projectId}/reports`, String(reportId));
  const snap = await getDoc(reportRef);
  if (!snap.exists()) throw new Error('일지를 찾을 수 없습니다.');

  const reportData = snap.data();

  let items;
  if (useSnapshot && reportData.itemsData && reportData.itemsData.length > 0) {
    // 불러오기/상세 보기: saveReport가 저장한 itemsData 필드 사용
    // → 서브컬렉션 삭제→재추가 타이밍 충돌 없음, 항상 확정된 스냅샷
    items = reportData.itemsData.map((item, i) => ({ id: `snap_${i}`, ...item }));
  } else {
    // 오늘 일지 실시간 상태: 서브컬렉션 사용 (배지 변경, 메모 수정 반영)
    // 구형 데이터(itemsData 없음) fallback도 여기서 처리
    const itemsQ = query(collection(db, `projects/${projectId}/reports/${reportId}/items`));
    const itemsSnap = await getDocs(itemsQ);
    items = itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  console.log(`[fetchReport] projectId=${projectId} reportId=${reportId} useSnapshot=${useSnapshot} → items 개수:`, items.length);

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

    // 대공정 이름 조회 — 일지에서 "어느 대공정 출신인지" 표시용 스냅샷
    let majorNameSnapshot = '';
    if (minor.majorId) {
      const majorSnap = await getDoc(doc(db, `projects/${projectId}/major_processes`, String(minor.majorId)));
      if (majorSnap.exists()) majorNameSnapshot = majorSnap.data().name ?? '';
    }

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
      nameSnapshot:      minor.name,          // Report.jsx: item.nameSnapshot
      statusSnapshot:    minor.status,         // Report.jsx: item.statusSnapshot
      memoSnapshot:      '',                   // 메모는 빈값으로 — 일지 안에서 별도 작성
      checklistMemoHint: minor.memo ?? '',     // 체크리스트 원본 메모 — 메모 버튼 클릭 시 힌트로 제공
      majorNameSnapshot,                       // 소속 대공정 이름 — 일지 목록에서 출처 표시용
    });
  }

  return { id: reportId };
}

/**
 * 오늘 날짜 보고서 조회 — 없으면 null 반환
 * where 쿼리로 서버 단 필터링 (전체 조회 후 클라이언트 필터 제거)
 */
export async function fetchTodayReport(projectId) {
  const today = new Date().toLocaleDateString('sv-SE');
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
  const today = new Date().toLocaleDateString('sv-SE');
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
 * 보고서 저장 — 메모/공정스냅샷은 report 문서에, 사진/도면은 서브컬렉션에 분산 저장
 * - items: 공정 스냅샷 배열. report 문서의 itemsData 필드에 직접 저장하여
 *   서브컬렉션 삭제→재추가 타이밍 충돌(race condition) 원천 차단
 * - 각 사진은 photos/{photoId} 문서에 { data: base64 } 형태
 */
export async function saveReport(projectId, reportId, { additionalMemo, photos = [], blueprints = [], items = null }) {
  // 1. 본문: 메모 + 저장 시각 업데이트
  //    items가 주어지면 itemsData 필드에도 함께 저장 (서브컬렉션 불필요)
  const reportRef = doc(db, `projects/${projectId}/reports`, String(reportId));

  const updateFields = {
    additionalMemo: additionalMemo ?? '',
    savedAt: new Date().toISOString(),
  };

  // items가 제공된 경우 document 필드로 직접 저장 → 서브컬렉션 race condition 완전 제거
  if (items !== null) {
    updateFields.itemsData = items.map(item => ({
      minorProcessId:    item.minorProcessId    ?? '',
      nameSnapshot:      item.nameSnapshot      ?? '',
      statusSnapshot:    item.statusSnapshot    ?? 'WAITING',
      memoSnapshot:      item.memoSnapshot      ?? '',
      checklistMemoHint: item.checklistMemoHint ?? '', // 힌트 필드도 함께 보존
      majorNameSnapshot: item.majorNameSnapshot ?? '', // 대공정 이름 보존
    }));
  }

  await setDoc(reportRef, updateFields, { merge: true });

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

/**
 * 오늘 날짜 보고서가 없으면 빈 문서를 생성하고 reportId 반환
 * 공정 없이 메모/사진만 먼저 저장할 때 사용 (saveReport의 사전 조건 충족)
 */
export async function ensureTodayReport(projectId, weather) {
  const today = new Date().toLocaleDateString('sv-SE');
  const q = query(
    collection(db, `projects/${projectId}/reports`),
    where('reportDate', '==', today)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) return snapshot.docs[0].id;

  // 오늘 일지가 없으면 빈 문서 생성
  const reportRef = doc(collection(db, `projects/${projectId}/reports`));
  await setDoc(reportRef, {
    reportDate: today,
    weather: weather ?? '',
    authorName: useAuthStore.getState().name || '담당자',
    additionalMemo: '',
    createdAt: new Date().toISOString(),
  });
  return reportRef.id;
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



/**
 * 불러오기 전용 — 오늘 일지 items를 완전히 교체 (기존 삭제 후 새로 쓰기)
 * 중복 체크 없이 paste처럼 덮어씀 → 불러오기 후 화면 상태가 과거 일지와 완전히 일치
 */
export async function replaceReportItems(projectId, reportId, items) {
  // 1. 기존 items 전체 삭제
  const existing = await getDocs(
    query(collection(db, `projects/${projectId}/reports/${reportId}/items`))
  );
  for (const d of existing.docs) await deleteDoc(d.ref);

  // 2. 과거 일지 items 그대로 삽입
  for (const item of items) {
    if (!item.minorProcessId) continue;
    const itemRef = doc(collection(db, `projects/${projectId}/reports/${reportId}/items`));
    await setDoc(itemRef, {
      minorProcessId: item.minorProcessId,
      nameSnapshot: item.nameSnapshot ?? '',
      statusSnapshot: item.statusSnapshot ?? 'WAITING',
      memoSnapshot: item.memoSnapshot ?? '',
    });
  }
}

/** 보고서 items 전체 삭제 — 일지 초기화 시 모든 공정 항목 일괄 제거 */
export async function clearReportItems(projectId, reportId) {
  const itemsQ = query(collection(db, `projects/${projectId}/reports/${reportId}/items`));
  const itemsSnap = await getDocs(itemsQ);
  for (const itemDoc of itemsSnap.docs) {
    await deleteDoc(itemDoc.ref);
  }
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
