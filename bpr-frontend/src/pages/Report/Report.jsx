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

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // [메모 작성 관련]
  const [openMemoItemId, setOpenMemoItemId] = useState(null);
  const [memoItemDraft, setMemoItemDraft] = useState('');

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

  /* [📷] 현장사진 핸들러 — 압축 후 state에 추가 (저장은 일지저장 버튼 시) */
  const handlePhotoChange = async (file) => {
    if (!file) return;
    const compressed = await compressImage(file);
    setPhotos((prev) => [...prev, compressed]);
  };
  const handleDeletePhoto = (index, e) => {
    e.stopPropagation();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  /* [📎] 도면 핸들러 — 선명도 유지 위해 품질 0.85, 최대 1400px */
  const handleBlueprintChange = async (file) => {
    if (!file) return;
    const compressed = await compressImage(file, 1400, 0.85);
    setBlueprints((prev) => [...prev, compressed]);
  };
  const handleDeleteBlueprint = (index, e) => {
    e.stopPropagation();
    setBlueprints((prev) => prev.filter((_, i) => i !== index));
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

  /* [일지저장] — 추가 메모 + 사진 + 도면 함께 저장 후 모달 오픈 */
  const handleSaveReport = async () => {
    if (!todayReport) {
      alert('공정을 먼저 추가해주세요.');
      return;
    }
    setSavingMemo(true);
    try {
      await saveReport(selectedProjectId, todayReport.id, {
        additionalMemo,
        photos,
        blueprints,
      });
      refetchToday();
      setShowSaveConfirm(true); // 저장 완료 후 모달 표시
    } catch (err) {
      alert('저장 실패: ' + (err.response?.data || err.message));
    } finally {
      setSavingMemo(false);
    }
  };

  /* [초기화] — 일지 페이지를 초기 값으로 리셋 (Firestore 데이터는 유지) */
  const handleReset = () => {
    setAdditionalMemo(todayReport?.additionalMemo ?? '');
    setPhotos(todayReport?.photos ?? []);
    setBlueprints(todayReport?.blueprints ?? []);
  };

  /* [불러오기] — 이전 보고서의 데이터를 현재 일지 페이지에 채움 */
  const handleLoadReport = (report) => {
    setAdditionalMemo(report.additionalMemo ?? '');
    setPhotos(report.photos ?? []);
    setBlueprints(report.blueprints ?? []);
    setShowHistory(false); // 모달 닫기
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
        <S.ResetBtn data-qa="report-reset-btn" onClick={handleReset} title="현재 입력 내용 초기화">
          🔄 초기화
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
                    {/* 상태 배지 (클릭 시 팝오버 열기) */}
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
                                  handleSetItemStatus({ itemId: item.id, nextStatus: st });
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
                      <S.ProcessMemoBtnCol>
                        <S.ProcessMemoSaveBtn
                          onClick={() => saveItemMemo(item.id)}
                          disabled={savingItemMemo}
                        >
                          {savingItemMemo ? '...' : '저장'}
                        </S.ProcessMemoSaveBtn>
                        <S.ProcessMemoCancelBtn onClick={() => setOpenMemoItemId(null)}>
                          취소
                        </S.ProcessMemoCancelBtn>
                      </S.ProcessMemoBtnCol>
                    </S.ProcessMemoArea>
                  )}
                </li>
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
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { handlePhotoChange(e.target.files[0]); e.target.value = ''; }} />
            {/* 도면 추가 — 풀너비 카드 */}
            <S.AddBlueprintBtn onClick={() => blueprintInputRef.current?.click()}>
              + 도면
            </S.AddBlueprintBtn>
            <input ref={blueprintInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { handleBlueprintChange(e.target.files[0]); e.target.value = ''; }} />
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
function ReportHistorySheet({ projectId, onClose, onLoad }) {
  const qc = useQueryClient();
  const [detailId, setDetailId] = useState(null);

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
                      {r.weather} · {r.items?.length ?? 0}개 공정
                    </S.CardMeta>
                  </div>
                  {/* 현재 일지에 데이터 세팅 */}
                  {onLoad && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoad(r);
                      }}
                      style={{
                        background: 'none', border: '1px solid #293552', borderRadius: '6px',
                        fontSize: '12px', color: '#293552', cursor: 'pointer', padding: '3px 8px',
                        marginRight: '4px', whiteSpace: 'nowrap',
                      }}
                      title="현재 일지에 불러오기"
                    >
                      📂 불러오기
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
    queryFn: () => fetchReport(projectId, reportId),
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
