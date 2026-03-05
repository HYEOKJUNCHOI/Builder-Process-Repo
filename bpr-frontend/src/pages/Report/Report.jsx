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
  updateAdditionalMemo,
  deleteReportItem,
} from './Report.api';
import { cycleStatus } from '../Checklist/Checklist.api';
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
  IN_PROGRESS: '진행중',
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
  /* 현장 사진 — 로컬 미리보기 (3 슬롯) */
  const [photos, setPhotos] = useState([null, null, null]);
  /* 공정 항목 메모 토글 — openMemoItemId: 현재 열린 항목 ID */
  const [openMemoItemId, setOpenMemoItemId] = useState(null);
  const [memoItemDraft, setMemoItemDraft] = useState('');

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

  /* [📷] 현장 사진 처리 — 브라우저 로컬 미리보기용 (DB 업로드 X) */
  const handlePhotoChange = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = e.target.result;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (index, e) => {
    e.stopPropagation(); // Prevents input from triggering
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  /* [✎] 공정 항목 메모 토글 — 다른 항목 열면 이전 항목 닫힘 */
  const handleToggleItemMemo = (item) => {
    if (openMemoItemId === item.id) {
      setOpenMemoItemId(null);
    } else {
      setOpenMemoItemId(item.id);
      setMemoItemDraft(item.memoSnapshot ?? '');
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

  /* [상태변경] 전역 공정 상태(status) 및 오늘 일지 스냅샷(statusSnapshot) 동시 변경 */
  const { mutate: handleCycleItemStatus } = useMutation({
    mutationFn: ({ minorId, currentStatus }) =>
      cycleStatus(selectedProjectId, minorId, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-today', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
    },
    onError: (err) => {
      alert('상태 변경 실패: ' + err.message);
    },
  });

  /* [✕] 일지 공정 항목 삭제 — 오늘 report의 items에서 해당 항목 제거 */
  const { mutate: handleDeleteItem } = useMutation({
    mutationFn: (itemId) => deleteReportItem(selectedProjectId, todayReport.id, itemId),
    onSuccess: () => {
      // 오늘 보고서 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ['report-today', selectedProjectId] });
    },
    onError: (err) => {
      alert('삭제 실패: ' + err.message);
    },
  });

  /* [일지저장] — 추가 메모 저장 후 알럿 */
  const handleSaveReport = async () => {
    if (!todayReport) {
      alert('공정을 먼저 추가해주세요.');
      return;
    }
    setSavingMemo(true);
    try {
      await updateAdditionalMemo(selectedProjectId, todayReport.id, additionalMemo);
      refetchToday();
      alert('일지가 저장되었습니다.');
    } catch (err) {
      alert('저장 실패: ' + (err.response?.data || err.message));
    } finally {
      setSavingMemo(false);
    }
  };

  /* [PDF만들기] — 현장명/주소/날씨/날짜/공정목록 프린트 (진행도링 제외) */
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
      .then(() => alert('클립보드에 복사되었습니다.'))
      .catch(() => alert('클립보드 복사를 지원하지 않는 환경입니다.'));
  };

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
              setPhotos([null, null, null]);
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
            <S.SectionTitle>진행중/완료 공정</S.SectionTitle>
            <S.SectionCount>{todayReport?.items?.length ?? 0}</S.SectionCount>
          </S.SectionHead>
          {!todayReport?.items?.length ? (
            <S.EmptyMsg>
              체크리스트나 오늘 할 일에서 📝를 눌러 추가하세요.
            </S.EmptyMsg>
          ) : (
            <S.ProcessList>
              {todayReport.items.map((item) => (
                // li 대신 div 래퍼로 메모 영역을 함께 감쌈 — border-bottom은 래퍼에
                <li key={item.id} style={{ borderBottom: `1px solid #f0efed` }}>
                  <S.ProcessItem style={{ borderBottom: 'none' }}>
                    {/* 상태 배지 (클릭 시 개별 변경) */}
                    <S.StatusChip
                      status={item.statusSnapshot}
                      onClick={() => handleCycleItemStatus({ minorId: item.minorProcessId, currentStatus: item.statusSnapshot })}
                    >
                      {STATUS_LABEL[item.statusSnapshot] ?? '-'}
                    </S.StatusChip>
                    <S.ProcessInfo>
                      <S.ProcessName>{item.nameSnapshot}</S.ProcessName>
                      {/* 메모가 접혀 있을 때만 미리보기 표시 */}
                      {openMemoItemId !== item.id && item.memoSnapshot && (
                        <S.ProcessSub>{item.memoSnapshot}</S.ProcessSub>
                      )}
                    </S.ProcessInfo>
                    {/* ✎ 메모 토글 — 메모 있으면 남색 강조 */}
                    <S.ProcessMemoToggleBtn
                      active={!!item.memoSnapshot || openMemoItemId === item.id}
                      onClick={() => handleToggleItemMemo(item)}
                      title="메모"
                    >
                      ✎
                    </S.ProcessMemoToggleBtn>
                    {/* ✕ 일지에서 해당 공정 항목 삭제 */}
                    <S.DeleteItemBtn
                      onClick={() => handleDeleteItem(item.id)}
                      title="일지에서 삭제"
                    >
                      ✕
                    </S.DeleteItemBtn>
                  </S.ProcessItem>

                  {/* 메모 편집 영역 — 토글 시 표시 */}
                  {openMemoItemId === item.id && (
                    <S.ProcessMemoArea>
                      <S.ProcessMemoTextarea
                        autoFocus
                        placeholder="공정 메모를 입력하세요..."
                        value={memoItemDraft}
                        onChange={(e) => setMemoItemDraft(e.target.value)}
                      />
                      <S.ProcessMemoSaveBtn
                        onClick={() => saveItemMemo(item.id)}
                        disabled={savingItemMemo}
                      >
                        {savingItemMemo ? '...' : '저장'}
                      </S.ProcessMemoSaveBtn>
                    </S.ProcessMemoArea>
                  )}
                </li>
              ))}
            </S.ProcessList>
          )}
        </S.SectionBox>

        {/* 현장 사진 — 로컬 미리보기 */}
        <S.SectionBox>
          <S.SectionHead>
            <S.SectionIcon>📷</S.SectionIcon>
            <S.SectionTitle>현장 사진</S.SectionTitle>
          </S.SectionHead>
          <S.PhotoGrid>
            {photos.map((photo, i) => (
              <S.PhotoSlot key={i}>
                {photo ? (
                  <>
                    <S.PhotoPreview src={photo} alt={`현장 사진 ${i + 1}`} />
                    <S.DeletePhotoBtn onClick={(e) => handleDeletePhoto(i, e)} title="사진 삭제">
                      ✕
                    </S.DeletePhotoBtn>
                  </>
                ) : (
                  <S.PhotoPlaceholder>
                    <S.PhotoPlus>+</S.PhotoPlus>
                    <S.PhotoLabel>사진 추가</S.PhotoLabel>
                  </S.PhotoPlaceholder>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoChange(i, e.target.files[0])}
                />
              </S.PhotoSlot>
            ))}
          </S.PhotoGrid>
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

        {/* 액션 버튼 3개 */}
        <S.ActionRow>
          <S.ActionBtn primary onClick={handleSaveReport} disabled={savingMemo}>
            {savingMemo ? '저장 중...' : '💾 일지저장'}
          </S.ActionBtn>
          <S.ActionBtn onClick={handleExportPdf}>
            🖨 PDF만들기
          </S.ActionBtn>
          <S.ActionBtn onClick={handleCopyText}>
            📋 글복사
          </S.ActionBtn>
        </S.ActionRow>
      </S.Content>

      <BottomNav />

      {/* 이전 보고서 바텀시트 */}
      {showHistory && (
        <ReportHistorySheet
          projectId={selectedProjectId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </S.Page>
  );
}

/**
 * 이전 보고서 바텀시트 — 날짜별 카드 목록
 */
function ReportHistorySheet({ projectId, onClose }) {
  const [detailId, setDetailId] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', projectId],
    queryFn: () => fetchReports(projectId),
    enabled: !!projectId,
  });

  return (
    <S.Overlay onClick={onClose}>
      <S.Sheet onClick={(e) => e.stopPropagation()}>
        <S.SheetHeader>
          <S.SheetTitle>이전 보고서</S.SheetTitle>
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
                <S.ReportCard key={r.id} onClick={() => setDetailId(r.id)}>
                  <S.CardDate>{r.reportDate}</S.CardDate>
                  <S.CardMeta>
                    {r.weather} · {r.items?.length ?? 0}개 공정
                  </S.CardMeta>
                  <S.CardArrow>›</S.CardArrow>
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
  const [memos, setMemos] = useState({});
  const [savingId, setSavingId] = useState(null);

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', projectId, reportId],
    queryFn: () => fetchReport(projectId, reportId),
  });

  const getMemo = (item) =>
    memos[item.id] !== undefined ? memos[item.id] : (item.memoSnapshot ?? '');

  const handleMemoSave = async (itemId) => {
    setSavingId(itemId);
    try {
      await updateReportItemMemo(projectId, reportId, itemId, memos[itemId] ?? '');
      qc.invalidateQueries({ queryKey: ['report', projectId, reportId] });
    } catch {
      alert('메모 저장 실패');
    } finally {
      setSavingId(null);
    }
  };

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
            {report ? `${report.reportDate} · ${report.weather}` : '일지 상세'}
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
          </S.ExportRow>
        )}

        <S.SheetBody>
          {isLoading ? (
            <S.EmptyMsg>불러오는 중...</S.EmptyMsg>
          ) : (
            (report?.items ?? []).map((item) => (
              <S.DetailItem key={item.id}>
                <S.DetailItemHeader>
                  <S.StatusChip status={item.statusSnapshot}>
                    {STATUS_LABEL[item.statusSnapshot] ?? item.statusSnapshot}
                  </S.StatusChip>
                  <S.DetailItemName>{item.nameSnapshot}</S.DetailItemName>
                </S.DetailItemHeader>

                <S.MemoInput
                  placeholder="현장 메모를 입력하세요..."
                  value={getMemo(item)}
                  onChange={(e) =>
                    setMemos((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                />

                <S.SaveBtn
                  style={{ height: 36, fontSize: 13 }}
                  onClick={() => handleMemoSave(item.id)}
                  disabled={savingId === item.id}
                >
                  {savingId === item.id ? '저장 중...' : '메모 저장'}
                </S.SaveBtn>
              </S.DetailItem>
            ))
          )}
        </S.SheetBody>
      </S.Sheet>
    </S.Overlay>
  );
}
