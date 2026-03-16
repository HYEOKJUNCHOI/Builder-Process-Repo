import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import BottomNav from '../../components/layout/BottomNav';
import StatsSection from '../../components/common/StatsSection';
import { fetchMyProjects, fetchDashboard } from '../Dashboard/Dashboard.api';
import { useWeather } from '../../hooks/useWeather';
import {
  fetchTodayReport,
  fetchReports,
  fetchReport,
  saveReport,
  ensureTodayReport,
  clearReportItems,
  updateReportItemMemo,
  updateReportItemStatus,
  deleteReportItem,
  deleteReport,
} from './Report.api';
import * as S from './Report.style';

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

/** 오늘 날짜 문자열 — "2026년 2월 22일 토요일" 형식 */
function formatToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const day = DAY_KO[now.getDay()];
  return `${y}년 ${m}월 ${d}일 ${day}요일`;
}

/** 상태 레이블 매핑 */
const STATUS_LABEL = {
  WAITING: '대기',
  IN_PROGRESS: '진행',
  TOUCH_UP: '마무리',
  DONE: '완료',
};

/**
 * 간편 보고 페이지
 * - 오늘 날짜·날씨·현장명·주소 다크 카드
 * - 진척도/진행도/공정편차 3형제 링
 * - 진행중/완료 공정 목록 + 상태 배지
 * - 현장 사진 슬롯 (로컬 미리보기)
 * - 추가 메모 입력
 * - [일지저장] [PDF만들기] [글복사] 버튼
 */
export default function Report() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [additionalMemo, setAdditionalMemo] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false); // 저장 완료 모달 표시 여부
  const [copiedText, setCopiedText] = useState(false); // 글복사 완료 피드백
  /* [📷] 현장 사진 / 화상 — 2열 정사각 그리드 */
  const [photos, setPhotos] = useState([]);
  const photoInputRef = React.useRef(null);

  /* [📎] 도면 — 풀 너비 카드 */
  const [blueprints, setBlueprints] = useState([]);
  const blueprintInputRef = React.useRef(null);

  /* [불러오기] 로드된 공정 항목 — photos/memo처럼 로컬 state로 즉시 반영
     null이면 todayReport.items 사용, 배열이면 이 값을 우선 표시 */
  const [loadedItems, setLoadedItems] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  // 초기화 버튼 더블탭 확인 — 미저장 상태에서 첫 클릭은 경고만 표시
  const [resetWarned, setResetWarned] = useState(false);

  // [메모 작성 관련]
  const [openMemoItemId, setOpenMemoItemId] = useState(null);
  const [memoItemDraft, setMemoItemDraft] = useState('');
  // hint: 체크리스트 원본 메모를 기본값으로 채운 상태 — 사용자가 타이핑하면 false로 전환
  const [memoIsHint, setMemoIsHint] = useState(false);

  // [상태 팝오버 관련]
  const [openStatusItemId, setOpenStatusItemId] = useState(null);

  /* 현장 목록 */
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchMyProjects,
  });

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  /* 현장 전환 시 불러오기 상태 초기화 */
  useEffect(() => { setLoadedItems(null); }, [selectedProjectId]);

  /* 현장 주소 기반 날씨 */
  const { weather } = useWeather(selectedProject?.address ?? null);

  /* 공정 통계 (진척도 3형제) */
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard', selectedProjectId],
    queryFn: () => fetchDashboard(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  /* 오늘 보고서 */
  const { data: todayReport, refetch: refetchToday } = useQuery({
    queryKey: ['report-today', selectedProjectId],
    queryFn: () => fetchTodayReport(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  /* 오늘 보고서가 바뀌면 추가 메모 동기화 */
  useEffect(() => {
    setAdditionalMemo(todayReport?.additionalMemo ?? '');
  }, [todayReport?.id]);

  /* [📷] 이미지 압축 — Canvas 기반 리사이즈 + JPEG 인코딩
     압축된 Base64를 saveReport 통해 Firestore 서브컬렉션에 개별 문서로 저장
     → 문서 1개당 1MB 제한이므로 사진 여러 장도 안전하게 저장 가능 */
  const compressImage = (file, maxPx = 1000, quality = 0.72) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(1, maxPx / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  /* [📷] 현장사진 핸들러 — 여러 장 동시 선택 가능, 각각 압축 후 state에 추가 */
  const handlePhotoChange = async (files) => {
    if (!files || files.length === 0) return;
    const compressed = await Promise.all(
      Array.from(files).map((file) => compressImage(file))
    );
    setPhotos((prev) => [...prev, ...compressed]);
  };
  const handleDeletePhoto = (index, e) => {
    e.stopPropagation();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  /* [📎] 도면 핸들러 — 여러 장 동시 선택 가능, 선명도 유지 위해 품질 0.85, 최대 1400px */
  const handleBlueprintChange = async (files) => {
    if (!files || files.length === 0) return;
    const compressed = await Promise.all(
      Array.from(files).map((file) => compressImage(file, 2800, 0.92))
    );
    setBlueprints((prev) => [...prev, ...compressed]);
  };
  const handleDeleteBlueprint = (index, e) => {
    e.stopPropagation();
    setBlueprints((prev) => prev.filter((_, i) => i !== index));
  };

  /* [✎] 공정 항목 메모 토글 — 다른 항목 열면 이전 항목 닫힘
     기존 메모가 있으면 그대로, 없으면 체크리스트 원본 메모(checklistMemoHint)를 기본값으로 채워줌
     → 사용자가 "저장" 바로 클릭 시 힌트 메모가 저장됨 / 새로 입력하면 새 메모로 교체됨 */
  const handleToggleItemMemo = (item) => {
    if (openMemoItemId === item.id) {
      setOpenMemoItemId(null);
      setMemoIsHint(false);
    } else {
      setOpenMemoItemId(item.id);
      const hasExistingMemo = !!(item.memoSnapshot);
      const hint = item.checklistMemoHint ?? '';
      if (hasExistingMemo) {
        // 이미 저장된 메모가 있으면 그대로 표시
        setMemoItemDraft(item.memoSnapshot);
        setMemoIsHint(false);
      } else if (hint) {
        // 메모 없고 힌트가 있으면 힌트를 회색으로 채워줌
        setMemoItemDraft(hint);
        setMemoIsHint(true);
      } else {
        // 메모도 힌트도 없으면 빈 상태
        setMemoItemDraft('');
        setMemoIsHint(false);
      }
    }
  };

  /* [저장] 공정 항목 메모 저장 후 오늘 보고서 캐시 갱신 */
  const { mutate: saveItemMemo, isPending: savingItemMemo } = useMutation({
    mutationFn: (itemId) =>
      updateReportItemMemo(selectedProjectId, todayReport.id, itemId, memoItemDraft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-today', selectedProjectId] });
      setOpenMemoItemId(null);
    },
    onError: (err) => {
      alert('메모 저장 실패: ' + err.message);
    },
  });

  /* [상태변경] 일지 전용 statusSnapshot 팝오버 선택 업데이트 */
  const { mutate: handleSetItemStatus } = useMutation({
    mutationFn: ({ itemId, nextStatus }) => {
      return updateReportItemStatus(selectedProjectId, todayReport.id, itemId, nextStatus);
    },
    onSuccess: () => {
      // 일지 캐시만 갱신 — 체크리스트/대시보드는 영향 없음
      queryClient.invalidateQueries({ queryKey: ['report-today', selectedProjectId] });
    },
    onError: (err) => {
      alert('상태 변경 실패: ' + err.message);
    },
  });

  /* [✕] 일지 공정 항목 삭제 — 오늘 report의 items에서 해당 항목 제거 */
  const { mutate: handleDeleteItem } = useMutation({
    mutationFn: (itemId) => deleteReportItem(selectedProjectId, todayReport.id, itemId),
    onSuccess: () => {
      // 일지 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ['report-today', selectedProjectId] });
      // 체크리스트의 isReported 플래그도 재계산되도록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
    },
    onError: (err) => {
      alert('삭제 실패: ' + err.message);
    },
  });

  /* ── 불러오기 모드 로컬 핸들러 ──────────────────────────────────────────
     불러오기 모드에서는 Firestore를 건드리지 않고 loadedItems state만 업데이트.
     일지저장 시 loadedItems가 itemsToSave로 그대로 전달되므로 별도 처리 불필요. */

  /** 불러오기 모드 — 상태 로컬 변경 */
  const handleSetLoadedItemStatus = (itemId, nextStatus) => {
    setLoadedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, statusSnapshot: nextStatus } : item
    ));
  };

  /** 불러오기 모드 — 메모 로컬 저장 */
  const handleSaveLoadedItemMemo = (itemId, memo) => {
    setLoadedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, memoSnapshot: memo } : item
    ));
    setOpenMemoItemId(null);
    setMemoIsHint(false);
  };

  /** 불러오기 모드 — 항목 로컬 삭제 */
  const handleDeleteLoadedItem = (itemId) => {
    setLoadedItems(prev => prev.filter(item => item.id !== itemId));
  };

  /* [일지저장] — 오늘 일지가 없으면 빈 문서 먼저 생성 후 메모/사진/도면 저장
     공정 없이 사진·메모만 먼저 저장하는 시나리오도 지원 */
  const handleSaveReport = async () => {
    if (!selectedProjectId) return;
    setSavingMemo(true);
    try {
      // todayReport?.id가 있으면 그대로 재사용 — createReport(📝)가 만든 문서와 동일 보장
      // todayReport가 null일 때(공정 미추가 첫 저장)만 ensureTodayReport로 새 문서 생성
      // 이전: 항상 ensureTodayReport → Firestore 캐시 미스 시 중복 문서 생성 위험 있었음
      const reportId = todayReport?.id ?? await ensureTodayReport(
        selectedProjectId,
        weather ? `${weather.emoji} ${weather.text} ${weather.temp}°C` : ''
      );

      // 사진·도면 개수 및 예상 base64 크기 콘솔 확인 (디버깅용)
      console.log('[일지저장] 사진:', photos.length, '장 / 도면:', blueprints.length, '장');
      photos.forEach((p, i) =>
        console.log(`  사진[${i}] base64 크기: ${Math.round(p.length / 1024)}KB`)
      );
      blueprints.forEach((b, i) =>
        console.log(`  도면[${i}] base64 크기: ${Math.round(b.length / 1024)}KB`)
      );

      // 현재 화면에 보이는 items를 saveReport에 함께 전달
      // → report 문서의 itemsData 필드에 직접 저장 (서브컬렉션 타이밍 충돌 완전 차단)
      const itemsToSave = loadedItems !== null ? loadedItems : (todayReport?.items ?? []);
      console.log('[일지저장] reportId:', reportId, '/ itemsToSave 개수:', itemsToSave.length);

      await saveReport(selectedProjectId, reportId, {
        additionalMemo,
        photos,
        blueprints,
        items: itemsToSave,
      });

      // 저장 완료 후 로컬 상태 자동 초기화 — 다음 작성을 위한 빈 슬레이트
      setAdditionalMemo('');
      setPhotos([]);
      setBlueprints([]);
      setLoadedItems(null); // 불러오기 모드 해제 → 오늘 일지 실시간 뷰로 복귀

      refetchToday();
      // 이전 보고서 목록도 즉시 반영되도록 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ['reports', selectedProjectId] });
      setShowSaveConfirm(true); // 저장 완료 후 모달 표시
    } catch (err) {
      // 상세 에러 출력으로 Firestore 용량 제한 등 원인 파악
      console.error('[일지저장 실패]', err);
      alert('저장 실패: ' + (err.message ?? '알 수 없는 오류'));
    } finally {
      setSavingMemo(false);
    }
  };

  /* [초기화] — 첫 클릭은 경고 표시(버튼 빨간색), 두 번째 클릭에서 전체 초기화 단행
     - 로컬 상태(메모/사진/도면) 비움
     - Firestore 오늘 일지 items 전체 삭제 → 진행중/완료 공정 목록 해제
     - 체크리스트·대시보드의 isReported 플래그도 재계산 */
  const handleReset = async () => {
    if (!resetWarned) {
      // 첫 번째 클릭 — 경고 상태로 전환, 3초 후 자동 해제
      setResetWarned(true);
      setTimeout(() => setResetWarned(false), 3000);
      return;
    }

    // 두 번째 클릭 — 모든 입력 초기화 + 오늘 일지 공정 항목 전체 삭제
    setAdditionalMemo('');
    setPhotos([]);
    setBlueprints([]);
    setLoadedItems(null); // 불러오기 상태도 초기화
    setResetWarned(false);

    if (todayReport?.id) {
      try {
        await clearReportItems(selectedProjectId, todayReport.id);
        // 일지·체크리스트·대시보드 캐시 갱신 (isReported 플래그 재계산)
        queryClient.invalidateQueries({ queryKey: ['report-today', selectedProjectId] });
        queryClient.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
      } catch (err) {
        console.error('[초기화 실패]', err);
      }
    }
  };

  /* [불러오기] — 이전 보고서 스냅샷을 읽기 전용으로 화면에 복원
     공정 항목은 과거 스냅샷 그대로 표시 (배지 변경 불필요 → Firestore 왕복 제거)
     초기화 버튼으로 오늘 일지 상태로 돌아갈 수 있음 */
  const handleLoadReport = (report) => {
    setAdditionalMemo(report.additionalMemo ?? '');
    setPhotos(report.photos ?? []);
    setBlueprints(report.blueprints ?? []);
    setLoadedItems(report.items ?? []);
    setShowHistory(false);
  };

  /* [PDF만들기] — 현장명/주소/날씨/날짜/공정목록 + 현장사진 프린트 */
  const handleExportPdf = () => {
    const items = todayReport?.items ?? [];
    const rows = items
      .map((item) => {
        const statusText = STATUS_LABEL[item.statusSnapshot] ?? item.statusSnapshot;
        const memo = item.memoSnapshot
          ? `<div class="memo">${item.memoSnapshot}</div>`
          : '';
        return `<div class="item">
          <div class="item-header">
            <span class="chip chip-${item.statusSnapshot ?? 'WAITING'}">${statusText}</span>
            <span class="name">${item.nameSnapshot}</span>
          </div>
          ${memo}
        </div>`;
      })
      .join('');

    // 비고(추가 메모) — 내용 있을 때만 출력
    const remarkSection = additionalMemo?.trim()
      ? `<h2 style="font-size:16px;color:#293552;margin:28px 0 8px;">비고</h2>
         <p style="font-size:13px;color:#706c66;line-height:1.8;white-space:pre-wrap;">${additionalMemo.trim()}</p>`
      : '';

    // 현장사진 — 2열 소형 (잉크 절약)
    const photoSection = photos.length > 0
      ? `<h2 style="font-size:16px;color:#293552;margin:28px 0 12px;">현장 사진</h2>
         <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
           ${photos.map((src) =>
        `<img src="${src}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:6px;" />`
      ).join('')}
         </div>`
      : '';

    // 도면 — 풀너비 (선명하게)
    const blueprintSection = blueprints.length > 0
      ? `<h2 style="font-size:16px;color:#293552;margin:28px 0 12px;">도면</h2>
         ${blueprints.map((src) =>
        `<img src="${src}" style="width:100%;height:auto;display:block;margin-bottom:16px;border-radius:6px;" />`
      ).join('')}`
      : '';

    const html = `<!DOCTYPE html>
<html lang="ko"><head>
  <meta charset="UTF-8">
  <title>현장 일지 — ${formatToday()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
           padding: 32px; color: #312e2a; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 22px; color: #293552; margin-bottom: 6px; }
    .meta { font-size: 13px; color: #706c66; margin-bottom: 4px; }
    .weather { font-size: 13px; color: #a8a49e; margin-bottom: 28px; }
    .item { padding: 14px 0; border-bottom: 1px solid #f0efed; }
    .item:last-child { border-bottom: none; }
    .item-header { display: flex; align-items: center; gap: 10px; }
    .name { font-size: 15px; font-weight: 600; }
    .chip { font-size: 11px; padding: 2px 8px; border-radius: 99px; font-weight: 600; }
    .chip-IN_PROGRESS { background: #EBF3FF; color: #1565C0; }
    .chip-TOUCH_UP    { background: #FFF3E0; color: #E65100; }
    .chip-DONE        { background: #E8F5E9; color: #2E7D32; }
    .chip-WAITING     { background: #f0efed; color: #706c66; }
    .memo { margin-top: 6px; font-size: 13px; color: #706c66; padding-left: 2px; line-height: 1.6; }
    @media print { body { padding: 20px; } }
  </style>
</head><body>
  <h1>${selectedProject?.name ?? '현장 일지'}</h1>
  <p class="meta">${selectedProject?.address ?? ''}</p>
  <p class="weather">${formatToday()}${weather ? `&nbsp;·&nbsp;${weather.emoji} ${weather.text} ${weather.temp}°C` : ''}</p>
  ${rows || '<p style="color:#a8a49e">추가된 공정이 없습니다.</p>'}
  ${remarkSection}
  ${photoSection}
  ${blueprintSection}
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { alert('팝업 차단을 해제해주세요.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  /* [글복사] — 현장명/주소/날씨/날짜/공정목록 클립보드 복사 (진행도링 제외) */
  const handleCopyText = () => {
    const items = todayReport?.items ?? [];
    const lines = [
      `[현장 일지] ${formatToday()}`,
      `현장명: ${selectedProject?.name ?? '-'}`,
      `주소: ${selectedProject?.address ?? '-'}`,
      weather ? `날씨: ${weather.emoji} ${weather.text} ${weather.temp}°C` : '',
      '',
      '[공정 현황]',
      ...items.map((item) => {
        const statusText = STATUS_LABEL[item.statusSnapshot] ?? item.statusSnapshot;
        const memo = item.memoSnapshot ? ` — ${item.memoSnapshot}` : '';
        return `• [${statusText}] ${item.nameSnapshot}${memo}`;
      }),
      additionalMemo ? `\n[메모]\n${additionalMemo}` : '',
    ].filter((line) => line !== '');

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      })
      .catch(() => alert('클립보드 복사를 지원하지 않는 환경입니다.'));
  };

  // 표시할 공정 목록: 불러오기 직후엔 loadedItems 우선, 이후 todayReport로 전환
  const displayItems = loadedItems !== null ? loadedItems : (todayReport?.items ?? []);

  return (
    <S.Page>
      {/* 헤더 */}
      <S.Header data-qa="report-header">
        <S.HeaderTitle data-qa="report-header-title">간편 보고</S.HeaderTitle>
        {projects.length > 0 && (
          <S.ProjectSelect
            data-qa="report-site-select"
            value={selectedProjectId ?? ''}
            onChange={(e) => {
              setSelectedProjectId(Number(e.target.value));
              setPhotos([]);
              setBlueprints([]);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.address ? ` / ${p.address}` : ''}
              </option>
            ))}
          </S.ProjectSelect>
        )}
        <S.HistoryBtn data-qa="report-history-btn" onClick={() => setShowHistory(true)}>
          🕐 이전 보고서
        </S.HistoryBtn>
        <S.ResetBtn
          data-qa="report-reset-btn"
          onClick={handleReset}
          title={resetWarned ? '한 번 더 클릭하면 초기화됩니다' : '현재 입력 내용 초기화'}
          style={resetWarned ? { color: '#e53e3e', borderColor: '#e53e3e' } : undefined}
        >
          {resetWarned ? '⚠️ 다시 클릭 시 초기화' : '🔄 초기화'}
        </S.ResetBtn>
      </S.Header>

      <S.Content>
        {/* 날짜(좌) + 날씨(우) 다크 카드 — 현장명/주소는 드롭다운에서 확인 */}
        <S.DarkCard>
          <S.DarkCardDate>{formatToday()}</S.DarkCardDate>
          {weather && (
            <S.DarkCardWeather>
              {weather.emoji} {weather.text} · {weather.temp}°C
            </S.DarkCardWeather>
          )}
        </S.DarkCard>



        {/* 진행중/완료 공정 목록 */}
        <S.SectionBox>
          <S.SectionHead>
            <S.SectionIcon>📋</S.SectionIcon>
            <S.SectionTitle>진행중 / 완료 공정</S.SectionTitle>
            <S.SectionCount>{displayItems.length}</S.SectionCount>
          </S.SectionHead>
          {!displayItems.length ? (
            <S.EmptyMsg>
              체크리스트나 오늘 할 일에서 📝를 눌러 추가하세요.
            </S.EmptyMsg>
          ) : (
            <S.ProcessList>
              {/* 대공정별 그룹핑 — Map 삽입 순서로 등록 순서 보장 */}
              {Array.from(
                displayItems.reduce((map, item) => {
                  const key = item.majorNameSnapshot ?? '기타';
                  if (!map.has(key)) map.set(key, []);
                  map.get(key).push(item);
                  return map;
                }, new Map())
              ).map(([majorName, groupItems]) => (
                <React.Fragment key={majorName}>
                  {/* 대공정 구분 헤더 */}
                  <S.MajorGroupHeader>{majorName}</S.MajorGroupHeader>
                  {groupItems.map((item) => (
                    // li 대신 div 래퍼로 메모 영역을 함께 감쌈 — border-bottom은 래퍼에
                    <li key={item.id} style={{ borderBottom: `1px solid #f0efed` }}>
                      <S.ProcessItem style={{ borderBottom: 'none' }}>
                        {/* 상태 배지 — 두 모드 모두 클릭 가능
                            오늘 일지 모드: Firestore 업데이트 / 불러오기 모드: 로컬 state 업데이트 */}
                        <div style={{ position: 'relative' }}>
                          <S.StatusChip
                            status={item.statusSnapshot}
                            onClick={() => setOpenStatusItemId(openStatusItemId === item.id ? null : item.id)}
                          >
                            {STATUS_LABEL[item.statusSnapshot] ?? '-'}
                          </S.StatusChip>
                          {openStatusItemId === item.id && (
                            <S.StatusPopover>
                              {['WAITING', 'IN_PROGRESS', 'TOUCH_UP', 'DONE']
                                .filter((st) => st !== item.statusSnapshot)
                                .map((st) => (
                                  <S.StatusOption
                                    key={st}
                                    status={st}
                                    onClick={() => {
                                      if (loadedItems !== null) {
                                        handleSetLoadedItemStatus(item.id, st);
                                      } else {
                                        handleSetItemStatus({ itemId: item.id, nextStatus: st });
                                      }
                                      setOpenStatusItemId(null);
                                    }}
                                  >
                                    {STATUS_LABEL[st]}
                                  </S.StatusOption>
                                ))}
                            </S.StatusPopover>
                          )}
                        </div>
                        <S.ProcessInfo>
                          <S.ProcessName>{item.nameSnapshot}</S.ProcessName>
                          {/* 메모 미리보기 — 편집창 열려있을 때만 숨김 */}
                          {openMemoItemId !== item.id && item.memoSnapshot && (
                            <S.ProcessSub>{item.memoSnapshot}</S.ProcessSub>
                          )}
                        </S.ProcessInfo>
                        {/* ✎ 메모 토글 / ✕ 삭제 — 두 모드 모두 표시
                            오늘 일지 모드: Firestore / 불러오기 모드: 로컬 state */}
                        <>
                          <S.ProcessMemoToggleBtn
                            active={!!item.memoSnapshot || openMemoItemId === item.id}
                            onClick={() => handleToggleItemMemo(item)}
                            title="메모"
                          >
                            ✎
                          </S.ProcessMemoToggleBtn>
                          <S.DeleteItemBtn
                            onClick={() => loadedItems !== null
                              ? handleDeleteLoadedItem(item.id)
                              : handleDeleteItem(item.id)}
                            title="목록에서 삭제"
                          >
                            ✕
                          </S.DeleteItemBtn>
                        </>
                      </S.ProcessItem>

                      {/* 메모 편집 영역 — 두 모드 모두 표시
                          저장 시: 오늘 일지 모드 → Firestore / 불러오기 모드 → 로컬 state */}
                      {openMemoItemId === item.id && (
                        <S.ProcessMemoArea>
                          <S.ProcessMemoTextarea
                            autoFocus
                            placeholder="공정 메모를 입력하세요..."
                            value={memoItemDraft}
                            onChange={(e) => {
                              setMemoItemDraft(e.target.value);
                              setMemoIsHint(false); // 직접 타이핑 시 힌트 모드 해제
                            }}
                            style={memoIsHint ? { color: '#a8a49e', fontStyle: 'italic' } : undefined}
                          />
                          {/* 버튼 컬럼 — 힌트 텍스트는 textarea 바깥(버튼 컬럼 상단)에 compact하게 배치
                              별도 행으로 빠지면 여백이 생기므로, 버튼 컬럼 안에 세로 스택으로 통합 */}
                          <S.ProcessMemoBtnCol>
                            {memoIsHint && (
                              <S.MemoHintLabel>
                                이전에 작성해뒀던<br/>메모를 불러옵니다.
                              </S.MemoHintLabel>
                            )}
                            <S.ProcessMemoSaveBtn
                              onClick={() => loadedItems !== null
                                ? handleSaveLoadedItemMemo(item.id, memoItemDraft)
                                : saveItemMemo(item.id)}
                              disabled={loadedItems === null && savingItemMemo}
                            >
                              {(loadedItems === null && savingItemMemo) ? '...' : '확인'}
                            </S.ProcessMemoSaveBtn>
                            <S.ProcessMemoCancelBtn onClick={() => { setOpenMemoItemId(null); setMemoIsHint(false); }}>
                              취소
                            </S.ProcessMemoCancelBtn>
                          </S.ProcessMemoBtnCol>
                        </S.ProcessMemoArea>
                      )}
                    </li>
                  ))}
                </React.Fragment>
              ))}
            </S.ProcessList>
          )}
        </S.SectionBox>

        {/* 현장 사진 + 도면 섹션 */}
        <S.SectionBox>
          <S.SectionHead>
            <S.SectionIcon>📷</S.SectionIcon>
            <S.SectionTitle>사진</S.SectionTitle>
            {/* 현장사진 추가 — 2열 정사각 그리드 */}
            <S.AddPhotoBtn onClick={() => photoInputRef.current?.click()}>
              + 현장사진
            </S.AddPhotoBtn>
            <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={(e) => { handlePhotoChange(e.target.files); e.target.value = ''; }} />
            {/* 도면 추가 — 풀너비 카드 */}
            <S.AddBlueprintBtn onClick={() => blueprintInputRef.current?.click()}>
              + 도면
            </S.AddBlueprintBtn>
            <input ref={blueprintInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={(e) => { handleBlueprintChange(e.target.files); e.target.value = ''; }} />
          </S.SectionHead>

          {/* 현장사진 — 2열 정사각 그리드 (648 / 2 = 324px 기준) */}
          {photos.length > 0 && (
            <S.PhotoGrid2Col>
              {photos.map((photo, i) => (
                <S.PhotoSquare key={i}>
                  <S.PhotoPreview src={photo} alt={`현장사진 ${i + 1}`} style={{ objectFit: 'cover' }} />
                  <S.DeletePhotoBtn onClick={(e) => handleDeletePhoto(i, e)} title="사진 삭제">✕</S.DeletePhotoBtn>
                </S.PhotoSquare>
              ))}
            </S.PhotoGrid2Col>
          )}

          {/* 도면 — 풀너비 카드 (object-fit: contain 으로 전체 표시) */}
          {blueprints.length > 0 && (
            <S.PhotoStack>
              {blueprints.map((bp, i) => (
                <S.PhotoCard key={i}>
                  <S.PhotoPreview src={bp} alt={`도면 ${i + 1}`} />
                  <S.DeletePhotoBtn onClick={(e) => handleDeleteBlueprint(i, e)} title="도면 삭제">✕</S.DeletePhotoBtn>
                </S.PhotoCard>
              ))}
            </S.PhotoStack>
          )}

          {photos.length === 0 && blueprints.length === 0 && (
            <S.EmptyMsg>현장사진 또는 도면을 추가하세요.</S.EmptyMsg>
          )}
        </S.SectionBox>

        {/* 추가 메모 */}
        <S.SectionBox>
          <S.SectionHead>
            <S.SectionIcon>✏️</S.SectionIcon>
            <S.SectionTitle>추가 메모</S.SectionTitle>
          </S.SectionHead>
          <S.MemoTextarea
            placeholder="오늘 현장에서 특이사항이나 전달사항을 입력하세요..."
            value={additionalMemo}
            onChange={(e) => setAdditionalMemo(e.target.value)}
          />
        </S.SectionBox>

        <S.ActionRow>
          <S.ActionBtn primary onClick={handleSaveReport} disabled={savingMemo}>
            {savingMemo ? '저장 중...' : '💾 일지저장'}
          </S.ActionBtn>
          <S.ActionBtn onClick={handleExportPdf}>
            🖨 PDF만들기
          </S.ActionBtn>
          <S.ActionBtn onClick={handleCopyText}>
            {copiedText ? '✓ 복사됨' : '📋 글복사'}
          </S.ActionBtn>
        </S.ActionRow>

      </S.Content>

      <BottomNav />

      {/* 저장 완료 모달 */}
      {showSaveConfirm && (
        <S.Overlay>
          <S.ConfirmModal>
            <S.ConfirmTitle>일지 저장 완료</S.ConfirmTitle>
            <S.ConfirmDesc>오늘의 현장 일지가 성공적으로 저장되었습니다.<br />작성된 내용을 출력하시거나 복사하시겠습니까?</S.ConfirmDesc>
            <S.ConfirmBtnGroup>
              <S.ConfirmCancelBtn onClick={() => setShowSaveConfirm(false)}>닫기</S.ConfirmCancelBtn>
              <S.ConfirmActionBtn onClick={() => { setShowSaveConfirm(false); handleCopyText(); }}>📋 글복사</S.ConfirmActionBtn>
              <S.ConfirmActionBtn primary onClick={() => { setShowSaveConfirm(false); handleExportPdf(); }}>🖨 PDF만들기</S.ConfirmActionBtn>
            </S.ConfirmBtnGroup>
          </S.ConfirmModal>
        </S.Overlay>
      )}

      {/* 이전 보고서 모달 */}
      {showHistory && (
        <ReportHistorySheet
          projectId={selectedProjectId}
          onClose={() => setShowHistory(false)}
          onLoad={handleLoadReport}
        />
      )}
    </S.Page>
  );
}

/**
 * 이전 보고서 바텀시트 — 날짜별 카드 목록
 */
/** ISO 문자열 → "MM/DD HH:MM" 포맷 */
function formatSavedAt(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

function ReportHistorySheet({ projectId, onClose, onLoad }) {
  const qc = useQueryClient();
  const [detailId, setDetailId] = useState(null);
  // 불러오기 버튼 클릭 시 사진·도면까지 풀 데이터 로드 중인 reportId
  const [loadingId, setLoadingId] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', projectId],
    queryFn: () => fetchReports(projectId),
    enabled: !!projectId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchMyProjects,
  });
  const projectName = projects.find(p => p.id === projectId)?.name || '현장명 없음';

  /* 이전 일지 삭제 */
  const { mutate: handleDeleteReport } = useMutation({
    mutationFn: (reportId) => deleteReport(projectId, reportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports', projectId] });
      alert('보고서가 삭제되었습니다.');
    },
    onError: (err) => {
      alert('삭제 실패: ' + err.message);
    },
  });

  return (
    <S.Overlay onClick={onClose}>
      <S.Sheet onClick={(e) => e.stopPropagation()}>
        <S.SheetHeader>
          <S.SheetTitle>{projectName} / 이전 보고서 목록</S.SheetTitle>
          <S.CloseBtn onClick={onClose}>✕</S.CloseBtn>
        </S.SheetHeader>

        <S.SheetBody style={{ padding: '12px 20px' }}>
          {isLoading ? (
            <S.EmptyMsg>불러오는 중...</S.EmptyMsg>
          ) : reports.length === 0 ? (
            <S.EmptyMsg>작성된 보고서가 없습니다.</S.EmptyMsg>
          ) : (
            <S.CardList style={{ padding: 0 }}>
              {reports.map((r) => (
                <S.ReportCard key={r.id}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setDetailId(r.id)}>
                    <S.CardDate>{r.reportDate}</S.CardDate>
                    <S.CardMeta>
                      저장: {formatSavedAt(r.savedAt ?? r.createdAt)}
                    </S.CardMeta>
                  </div>
                  {/* 현재 일지에 데이터 세팅 — fetchReport로 사진·도면까지 포함하여 로드 */}
                  {onLoad && (
                    <button
                      disabled={loadingId === r.id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingId(r.id);
                        try {
                          // useSnapshot:true → itemsData 필드 우선 사용 (서브컬렉션 타이밍 충돌 차단)
                          const fullReport = await fetchReport(projectId, r.id, { useSnapshot: true });
                          console.log('[불러오기] items 개수:', fullReport.items?.length, '/ photos 개수:', fullReport.photos?.length);
                          await onLoad(fullReport);
                        } catch (err) {
                          alert('불러오기 실패: ' + err.message);
                        } finally {
                          setLoadingId(null);
                        }
                      }}
                      style={{
                        background: 'none', border: '1px solid #293552', borderRadius: '6px',
                        fontSize: '12px', color: '#293552', cursor: 'pointer', padding: '3px 8px',
                        marginRight: '4px', whiteSpace: 'nowrap',
                        opacity: loadingId === r.id ? 0.5 : 1,
                      }}
                      title="현재 일지에 불러오기"
                    >
                      {loadingId === r.id ? '로딩...' : '📂 불러오기'}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`'${r.reportDate}' 날짜의 보고서를 정말 삭제할까요?`)) {
                        handleDeleteReport(r.id);
                      }
                    }}
                    style={{
                      background: 'none', border: 'none', fontSize: '16px', color: '#e53e3e',
                      cursor: 'pointer', padding: '4px'
                    }}
                    title="보고서 삭제"
                  >
                    🗑
                  </button>
                </S.ReportCard>
              ))}
            </S.CardList>
          )}
        </S.SheetBody>
      </S.Sheet>

      {/* 상세 시트 */}
      {detailId && (
        <ReportDetailSheet
          projectId={projectId}
          reportId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </S.Overlay>
  );
}

/**
 * 일지 상세 바텀시트
 * - 공정 스냅샷 목록 + 항목별 메모
 * - 마크다운 복사 / PDF 내보내기
 */
function ReportDetailSheet({ projectId, reportId, onClose }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', projectId, reportId],
    // useSnapshot:true → 저장된 itemsData 필드 사용 (상세 보기는 read-only 스냅샷)
    queryFn: () => fetchReport(projectId, reportId, { useSnapshot: true }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchMyProjects,
  });
  const projectName = projects.find(p => p.id === projectId)?.name || '현장명 없음';

  const handleCopyMarkdown = () => {
    if (!report) return;
    const lines = [
      `# 현장 일지 — ${report.reportDate}`,
      ``,
      `> 날씨: ${report.weather}`,
      ``,
      `## 작업 공정`,
      ``,
      ...(report.items ?? []).map((item) => {
        const status = STATUS_LABEL[item.statusSnapshot] ?? item.statusSnapshot;
        const memo = item.memoSnapshot ? `\n  > ${item.memoSnapshot}` : '';
        return `- **${item.nameSnapshot}** \`${status}\`${memo}`;
      }),
    ];
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => alert('클립보드 복사를 지원하지 않는 환경입니다.'));
  };

  const handleExportPdf = () => {
    if (!report) return;
    const rows = (report.items ?? [])
      .map((item) => {
        const status = STATUS_LABEL[item.statusSnapshot] ?? item.statusSnapshot;
        const memo = item.memoSnapshot ? `<div class="memo">${item.memoSnapshot}</div>` : '';
        return `<div class="item">
          <div class="item-header">
            <span class="name">${item.nameSnapshot}</span>
            <span class="chip">${status}</span>
          </div>
          ${memo}
        </div>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="ko"><head>
  <meta charset="UTF-8">
  <title>일지 — ${report.reportDate}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
           padding: 32px; color: #312e2a; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 22px; color: #293552; margin-bottom: 4px; }
    .meta { font-size: 13px; color: #a8a49e; margin-bottom: 28px; }
    .item { padding: 14px 0; border-bottom: 1px solid #f0efed; }
    .item:last-child { border-bottom: none; }
    .item-header { display: flex; align-items: center; gap: 10px; }
    .name { font-size: 15px; font-weight: 600; }
    .chip { font-size: 11px; padding: 2px 8px; border-radius: 99px;
            background: #f0efed; color: #706c66; }
    .memo { margin-top: 6px; font-size: 13px; color: #706c66;
            padding-left: 2px; line-height: 1.6; }
    @media print { body { padding: 20px; } }
  </style>
</head><body>
  <h1>현장 일지</h1>
  <p class="meta">${report.reportDate} &nbsp;·&nbsp; 날씨: ${report.weather}</p>
  ${rows}
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { alert('팝업 차단을 해제해주세요.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <S.Overlay onClick={onClose}>
      <S.Sheet onClick={(e) => e.stopPropagation()}>
        <S.SheetHeader>
          <S.SheetTitle>
            {report ? `${report.reportDate} / ${projectName} / 날씨 ${report.weather}` : '일지 상세'}
          </S.SheetTitle>
          <S.CloseBtn onClick={onClose}>✕</S.CloseBtn>
        </S.SheetHeader>

        {report && (
          <S.ExportRow>
            <S.ExportBtn onClick={handleCopyMarkdown}>
              {copied ? '✓ 복사됨' : '📋 마크다운 복사'}
            </S.ExportBtn>
            <S.ExportBtn onClick={handleExportPdf}>
              🖨 PDF 내보내기
            </S.ExportBtn>
            <S.ExportBtn
              onClick={() => {
                if (window.confirm(`'${report.reportDate}' 날짜의 보고서를 정말 삭제할까요?`)) {
                  handleDeleteReport();
                }
              }}
              style={{ borderColor: '#e53e3e', color: '#e53e3e' }}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '🗑 보고서 삭제'}
            </S.ExportBtn>
          </S.ExportRow>
        )}

        <S.SheetBody style={{ padding: '0', background: '#f5f5f5' }}>
          {isLoading ? (
            <S.EmptyMsg>불러오는 중...</S.EmptyMsg>
          ) : (
            <S.PdfPreviewBox>
              <S.PdfTitle>현장 일지</S.PdfTitle>
              <S.PdfMetaLine>{report?.reportDate} &nbsp;·&nbsp; 날씨: {report?.weather}</S.PdfMetaLine>

              <div style={{ marginTop: '24px' }}>
                {(report?.items ?? []).map((item) => (
                  <S.PdfItemRow key={item.id}>
                    <S.PdfItemHeader>
                      <S.PdfItemName>{item.nameSnapshot}</S.PdfItemName>
                      <S.PdfItemChip status={item.statusSnapshot}>
                        {STATUS_LABEL[item.statusSnapshot] ?? item.statusSnapshot}
                      </S.PdfItemChip>
                    </S.PdfItemHeader>
                    {item.memoSnapshot && (
                      <S.PdfItemMemoRow>{item.memoSnapshot}</S.PdfItemMemoRow>
                    )}
                  </S.PdfItemRow>
                ))}
              </div>

              {report?.additionalMemo && (
                <>
                  <S.PdfSectionHeader>비고</S.PdfSectionHeader>
                  <S.PdfRemark>{report.additionalMemo}</S.PdfRemark>
                </>
              )}
            </S.PdfPreviewBox>
          )}
        </S.SheetBody>
      </S.Sheet>
    </S.Overlay>
  );
}
