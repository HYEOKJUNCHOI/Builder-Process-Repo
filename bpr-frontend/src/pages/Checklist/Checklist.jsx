import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomNav from '../../components/layout/BottomNav';
import {
  fetchChecklist,
  toggleToday,
  updateMinorMemo,
  addMajorProcess,
  addMinorProcess,
  deleteMajorProcess,
  deleteMinorProcess,
  updateProject,
  deleteProject,
  setMinorStatus,
  reorderMinorProcess,
  reorderMajorProcess,
} from './Checklist.api';
import { fetchMyProjects, saveProjectAsTemplate } from '../Dashboard/Dashboard.api';
import CreateProjectSheet from '../../components/common/CreateProjectSheet';
import { createReport, removeMinorFromTodayReport } from '../Report/Report.api';
import { useWeather } from '../../hooks/useWeather';
import * as S from './Checklist.style';

const STATUS_LABEL = {
  WAITING: '대기',
  IN_PROGRESS: '진행',
  TOUCH_UP: '마무리',
  DONE: '완료',
};

/** 구분선으로 사용할 소공정 이름 마커 — 이 이름이면 구분선으로 렌더링 */
const DIVIDER_NAME = '─────────────────';

/**
 * 체크리스트 페이지 — 레시피 카드 그리드 뷰
 * - 대공정을 카드로 표시 (이미지 70% + 텍스트 30%)
 * - 카드 탭 → 소공정 바텀시트 (상태순환·오늘할일·추가·삭제)
 * - 현장 없으면 생성 유도, 대공정 추가 버튼 제공
 */
export default function Checklist() {
  const qc = useQueryClient();
  const location = useLocation();
  const preselectedTemplateId = location.state?.templateId;

  /* ProcessRepo에서 현장을 새로 만들어 넘어온 경우 해당 현장을 바로 선택 */
  const incomingProjectId = location.state?.selectedProjectId ?? null;
  const [selectedProjectId, setSelectedProjectId] = useState(incomingProjectId);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  /* 커스텀 프롬프트 모달 상태 */
  const [promptState, setPromptState] = useState({ open: false, value: '', message: '' });
  const promptResolveRef = useRef(null);

  /* window.prompt 대체 함수 — Promise 기반 */
  const showPrompt = (message, defaultValue = '') => new Promise((resolve) => {
    promptResolveRef.current = resolve;
    setPromptState({ open: true, value: defaultValue, message });
  });
  const handlePromptConfirm = () => {
    promptResolveRef.current?.(promptState.value.trim() || null);
    setPromptState((p) => ({ ...p, open: false }));
  };
  const handlePromptCancel = () => {
    promptResolveRef.current?.(null);
    setPromptState((p) => ({ ...p, open: false }));
  };
  const [addingMajor, setAddingMajor] = useState(false);
  const [majorInputValue, setMajorInputValue] = useState('');

  /* 3단 레이아웃용 상태 */
  const [activeMajorId, setActiveMajorId] = useState(null);
  /* 좌측 사이드바 컨테이너 ref — 사이드바 자체만 스크롤하기 위해 사용 */
  const sidebarNavRef = useRef(null);
  /* 우측 사이드바 ref — 휠 이벤트 페이지 전파 방지용 */
  const rightSidebarRef = useRef(null);
  const [globalMinorName, setGlobalMinorName] = useState('');
  const [globalMinorMemo, setGlobalMinorMemo] = useState('');

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

  /* 체크리스트 — staleTime:0 + refetchOnMount:'always' 로 페이지 이동 시마다 항상 최신 데이터 조회 */
  const { data: checklist, isLoading } = useQuery({
    queryKey: ['checklist', selectedProjectId],
    queryFn: () => fetchChecklist(selectedProjectId),
    enabled: !!selectedProjectId,
    staleTime: 0,             // 캐시를 항상 stale 취급 → 언제든 다시 가져옴
    refetchOnMount: 'always', // 해당 쿼리가 마운트될 때마다 무조건 재조회
  });

  const majorProcesses = checklist?.majorProcesses ?? [];

  // 현재 선택된 현장 데이터 (수정 시트 초기값으로 활용)
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  /* 현장 주소 기반 날씨 — 내일 예보 포함 */
  const { tomorrow } = useWeather(selectedProject?.address ?? null);

  /* 공정 구조를 공정 레퍼런스(템플릿)로 저장 — 배지 상태 모두 대기로 초기화 */
  const saveTemplateMutation = useMutation({
    mutationFn: ({ projectId, templateName }) => saveProjectAsTemplate(projectId, templateName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      alert('공정 레퍼런스에 저장되었습니다.');
    },
    onError: (err) => {
      alert('저장 실패: ' + err.message);
    },
  });

  const handleSaveAsTemplate = async () => {
    if (!selectedProjectId || !selectedProject) return;
    const name = await showPrompt('템플릿 이름을 입력하세요:', selectedProject.name ?? '');
    if (!name?.trim()) return;
    saveTemplateMutation.mutate({ projectId: selectedProjectId, templateName: name.trim() });
  };

  /* 현장 삭제 */
  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      // 삭제 후 남은 현장 중 첫 번째로 이동 (없으면 null)
      const remaining = projects.filter((p) => p.id !== selectedProjectId);
      setSelectedProjectId(remaining.length > 0 ? remaining[0].id : null);
    },
  });

  const handleDeleteProject = () => {
    if (!selectedProject) return;
    if (!window.confirm(`'${selectedProject.name}' 현장을 삭제할까요?\n\n대공정·소공정 데이터도 모두 삭제됩니다.`)) return;
    deleteProjectMutation.mutate(selectedProjectId);
  };

  /* 대공정 추가 */
  const addMajorMutation = useMutation({
    mutationFn: ({ projectId, name }) => addMajorProcess(projectId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
      setAddingMajor(false);
      setMajorInputValue('');
    },
  });

  const delMajorMutation = useMutation({
    // 수정 전: mutate(majorId) 만 넘것역서 projectId 누락 → Firestore 경로 오류
    mutationFn: ({ projectId, majorId }) => deleteMajorProcess(projectId, majorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
    },
  });

  const handleAddMajorSubmit = () => {
    if (!majorInputValue.trim() || !selectedProjectId) return;
    addMajorMutation.mutate({ projectId: selectedProjectId, name: majorInputValue.trim() });
  };

  const handleDeleteMajor = (majorId, majorName) => {
    if (!window.confirm(`'${majorName}' 대공정과 하위 소공정이 모두 삭제됩니다. 계속할까요?`)) return;
    // projectId를 함께 네여야 Firestore 경로가 올바르게 구성됨
    delMajorMutation.mutate({ projectId: selectedProjectId, majorId });
  };

  /* ── 클릭 선택 상태 — 소공정/대공정 키보드 ↑↓ 이동용 ── */
  const [selectedMinorId, setSelectedMinorId] = useState(null);
  const [selectedMajorIdForOrder, setSelectedMajorIdForOrder] = useState(null);

  /* 키보드 ↑↓로 선택된 항목 이동 */
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // 인풋 계열에서는 기본 동작 유지
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

      const direction = e.key === 'ArrowUp' ? -1 : 1;

      if (selectedMinorId) {
        e.preventDefault();
        // 선택된 소공정이 속한 대공정 찾기
        const ownerMajor = majorProcesses.find(m =>
          m.minorProcesses?.some(n => n.id === selectedMinorId)
        );
        if (!ownerMajor) return;
        const minors = ownerMajor.minorProcesses ?? [];
        const idx = minors.findIndex(n => n.id === selectedMinorId);
        if (idx === -1) return;
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= minors.length) return;

        const a = minors[idx];
        const b = minors[targetIdx];
        let ca1 = a.createdAt;
        let ca2 = b.createdAt;
        if (!ca1 || !ca2 || ca1 === ca2) {
          const now = Date.now();
          ca1 = direction < 0 ? new Date(now + 1).toISOString() : new Date(now).toISOString();
          ca2 = direction < 0 ? new Date(now).toISOString() : new Date(now + 1).toISOString();
        }
        try {
          await reorderMinorProcess(selectedProjectId, a.id, ca1, b.id, ca2);
          qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
        } catch (err) {
          alert('소공정 순서 변경 실패: ' + err.message);
        }

      } else if (selectedMajorIdForOrder) {
        e.preventDefault();
        const idx = majorProcesses.findIndex(m => m.id === selectedMajorIdForOrder);
        if (idx === -1) return;
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= majorProcesses.length) return;

        const a = majorProcesses[idx];
        const b = majorProcesses[targetIdx];
        let ca1 = a.createdAt;
        let ca2 = b.createdAt;
        if (!ca1 || !ca2 || ca1 === ca2) {
          const now = Date.now();
          ca1 = direction < 0 ? new Date(now + 1).toISOString() : new Date(now).toISOString();
          ca2 = direction < 0 ? new Date(now).toISOString() : new Date(now + 1).toISOString();
        }
        try {
          await reorderMajorProcess(selectedProjectId, a.id, ca1, b.id, ca2);
          qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
        } catch (err) {
          alert('대공정 순서 변경 실패: ' + err.message);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMinorId, selectedMajorIdForOrder, majorProcesses, selectedProjectId]);

  /* --------------------------------------------------------------------------
     [로직] 우측 사이드바: 공용 소공정 추가
  ---------------------------------------------------------------------------*/
  const addMinorMutation = useMutation({
    mutationFn: ({ majorId, name, memo }) => addMinorProcess(selectedProjectId, majorId, name, memo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
      setGlobalMinorName('');
      setGlobalMinorMemo('');
    },
  });

  const handleGlobalAddMinor = () => {
    if (!globalMinorName.trim() || !activeMajorId) return;
    addMinorMutation.mutate({ majorId: activeMajorId, name: globalMinorName.trim(), memo: globalMinorMemo });
  };

  const handleGlobalAddDivider = () => {
    if (!activeMajorId) return;
    addMinorMutation.mutate({ majorId: activeMajorId, name: DIVIDER_NAME, memo: '' });
  };

  /* --------------------------------------------------------------------------
     [로직] 좌측 사이드바: 활성 대공정 탐지 및 스크롤
  ---------------------------------------------------------------------------*/
  const scrollToSidebarNav = (id) => {
    const navEl = document.getElementById(`nav-item-${id}`);
    const sidebar = sidebarNavRef.current;
    if (!navEl || !sidebar) return;

    // 활성 항목이 사이드바 가운데에 오도록 사이드바 자체를 스크롤
    // (window 스크롤에 영향을 주지 않기 위해 scrollIntoView 대신 직접 계산)
    const targetScroll = navEl.offsetTop - sidebar.clientHeight / 2 + navEl.offsetHeight / 2;
    sidebar.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
  };

  const handleScrollToMajor = (id) => {
    setActiveMajorId(id);
    const element = document.getElementById(`major-section-${id}`);
    if (element) {
      const headerOffset = 130;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    scrollToSidebarNav(id);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!majorProcesses || majorProcesses.length === 0) return;

      // 스크롤 시 화면 중앙 쪽에서 다음 섹션이 잡히면 즉시 탭 넘기기 (간당간당함 해결)
      // 화면 절반 가까이 올려야 다음 공정이 잡히도록 감지선(detectionLine)을 더 깊게 설정 
      const detectionLine = 450;

      let currentActiveId = majorProcesses[0].id; // 기본값은 첫 번째

      // 감지선(160)을 넘어간(스크롤 된) 섹션들 중 가장 마지막 섹션을 현재 섹션으로 판별
      for (const major of majorProcesses) {
        const el = document.getElementById(`major-section-${major.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= detectionLine) {
            currentActiveId = major.id;
          }
        }
      }

      // 화면 맨 아래(zoom: 0.85 비율 오차 및 모바일 오차 허용 80px)에 도달했는지 정밀 확인
      const scrollTop = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop);
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const docHeight = Math.max(
        document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight
      );

      // zoom 비율 대신 네이티브 스케일링을 사용하므로,
      // 실제 바닥에 거의 닿았을 때(10px 오차)만 마지막 공정으로 강제 인식하도록 수정
      if (docHeight > windowHeight && scrollTop + windowHeight >= docHeight - 10) {
        currentActiveId = majorProcesses[majorProcesses.length - 1].id;
      }

      // 상태가 바뀌었을 때만 업데이트 (무한 렌더링 방지)
      setActiveMajorId((prev) => {
        if (prev !== currentActiveId) {
          scrollToSidebarNav(currentActiveId);
          return currentActiveId;
        }
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll);
    // 초기 렌더링 시 현재 스크롤 위치에 맞는 탭 활성화
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [majorProcesses]);

  /* 우측 사이드바 위에서 휠 이벤트가 페이지로 전파되지 않도록 non-passive 리스너 등록
   * CSS(overscroll-behavior)는 scrollHeight === clientHeight일 때 효과 없음 → JS 필요 */
  useEffect(() => {
    const el = rightSidebarRef.current;
    if (!el) return;

    const handler = (e) => {
      // 드롭다운 목록처럼 자체 스크롤이 있는 자식이면 그쪽에서 소비하도록 통과
      let node = e.target;
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight) return;
        node = node.parentElement;
      }
      e.preventDefault();
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  });

  const activeMajor = majorProcesses.find((m) => m.id === activeMajorId);

  return (
    <S.Page>
      <S.Header>
        {/* 1행: 타이틀 + 현장선택 + 내일날씨 + 수정/삭제 아이콘 */}
        <S.HeaderRow>
          <S.HeaderTitle>체크리스트</S.HeaderTitle>
          {projects.length > 0 && (
            <>
              <S.ProjectSelect
                value={selectedProjectId ?? ''}
                onChange={(e) => {
                  // Firestore 문서 ID는 문자열 — Number() 변환하면 NaN 발생
                  setSelectedProjectId(e.target.value);
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.address ? ` / ${p.address}` : ''}
                  </option>
                ))}
              </S.ProjectSelect>
              {tomorrow && !isNaN(tomorrow.tempMax) && (
                <S.TomorrowWeather>
                  내일 {tomorrow.emoji} {tomorrow.text} {tomorrow.tempMax}°/{tomorrow.tempMin}°
                </S.TomorrowWeather>
              )}
              {selectedProjectId && (
                <S.HeaderActions>
                  <S.HeaderIconBtn
                    title="현장 정보 수정"
                    onClick={() => setShowEditSheet(true)}
                  >
                    ✏
                  </S.HeaderIconBtn>
                  <S.HeaderIconBtn
                    title="현장 삭제"
                    danger
                    onClick={handleDeleteProject}
                  >
                    🗑
                  </S.HeaderIconBtn>
                </S.HeaderActions>
              )}
            </>
          )}
        </S.HeaderRow>
      </S.Header>

      {/* 현장 없을 때 */}
      {projects.length === 0 && (
        <>
          <S.EmptyMsg>{'등록된 현장이 없습니다.\n아래 버튼으로 첫 현장을 만들어보세요.'}</S.EmptyMsg>
          <S.NewProjectBtn onClick={() => setShowCreateSheet(true)}>
            + 새 현장 만들기
          </S.NewProjectBtn>
        </>
      )}

      {/* 현장 있을 때 */}
      {projects.length > 0 && (
        <>
          {/* [LEFT] 좌측 내비게이션 - floating */}
          <S.LeftSidebarWrapper>
            {/* 타이틀: 스크롤해도 항상 상단 고정 */}
            <S.RightPanelTitle style={{ padding: '0 14px', marginBottom: '8px', flexShrink: 0 }}>대공정 목록</S.RightPanelTitle>
            {/* 목록 영역만 스크롤 (ref로 중앙 스크롤 계산) */}
            <S.NavScrollArea ref={sidebarNavRef}>
              {majorProcesses.map((major) => (
                <S.NavItem
                  id={`nav-item-${major.id}`}
                  key={`nav-${major.id}`}
                  active={activeMajor?.id === major.id}
                  onClick={() => handleScrollToMajor(major.id)}
                >
                  {major.name}
                </S.NavItem>
              ))}
            </S.NavScrollArea>
          </S.LeftSidebarWrapper>

          {/* [RIGHT] 우측 컨트롤 패널 - floating */}
          <S.RightSidebarWrapper ref={rightSidebarRef}>
            <S.RightPanelTitle>작업 추가</S.RightPanelTitle>

            {/* 새 현장 추가 버튼 (상단 배치) */}
            <S.SidebarActionBtn onClick={() => setShowCreateSheet(true)}>
              + 새 현장 추가
            </S.SidebarActionBtn>

            {/* 대공정 추가 폼 or 버튼 (상단 배치) */}
            {addingMajor ? (
              /* 사이드바(200px) 안에서는 세로 스택으로 배치 */
              <S.SidebarAddForm>
                {/* GlobalAddInput: width:100% 명시되어 있어 column flex 안에서도 꽉 참 */}
                <S.GlobalAddInput
                  autoFocus
                  placeholder="대공정 이름"
                  value={majorInputValue}
                  onChange={(e) => setMajorInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMajorSubmit();
                    if (e.key === 'Escape') { setAddingMajor(false); setMajorInputValue(''); }
                  }}
                />
                <S.SidebarAddActions>
                  <S.AddConfirmBtn style={{ flex: 1 }} onClick={handleAddMajorSubmit}>추가</S.AddConfirmBtn>
                  <S.AddCancelBtn onClick={() => { setAddingMajor(false); setMajorInputValue(''); }}>취소</S.AddCancelBtn>
                </S.SidebarAddActions>
              </S.SidebarAddForm>
            ) : (
              selectedProjectId && (
                <S.SidebarActionBtn onClick={() => { setAddingMajor(true); setMajorInputValue(''); }}>
                  + 대공정 추가
                </S.SidebarActionBtn>
              )
            )}

            <S.MajorDivider style={{ margin: '8px 0', borderTop: '1px dashed #E2E8F0' }} />

            <S.RightPanelTitle>소공정 등록</S.RightPanelTitle>
            {majorProcesses.length > 0 ? (
              <>
                {/* 스크롤 스파이가 자동으로 활성 대공정을 표시 */}
                <S.TargetMajorBadge data-qa="checklist-minor-major-badge">
                  {activeMajor?.name ?? '—'}
                </S.TargetMajorBadge>
                <S.GlobalAddFormGroup>
                  <S.GlobalAddLabel>소공정명</S.GlobalAddLabel>
                  <S.GlobalAddInput
                    placeholder="예시) 터파기"
                    value={globalMinorName}
                    onChange={(e) => setGlobalMinorName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleGlobalAddMinor(); }}
                  />
                </S.GlobalAddFormGroup>
                <S.GlobalAddFormGroup>
                  <S.GlobalAddLabel>메모(선택)</S.GlobalAddLabel>
                  <S.GlobalAddTextarea
                    placeholder="참고사항 입력..."
                    value={globalMinorMemo}
                    onChange={(e) => setGlobalMinorMemo(e.target.value)}
                  />
                </S.GlobalAddFormGroup>
                <S.GlobalAddModalActions>
                  <S.GlobalAddSubmitBtn
                    disabled={!globalMinorName.trim() || addMinorMutation.isPending}
                    onClick={handleGlobalAddMinor}
                  >
                    추가하기
                  </S.GlobalAddSubmitBtn>
                </S.GlobalAddModalActions>

                {/* 현재 공정 구조를 공정 레퍼런스(템플릿)로 저장 — 배지 모두 대기 초기화 */}
                <S.SaveTemplateBtn
                  onClick={handleSaveAsTemplate}
                  disabled={saveTemplateMutation.isPending}
                  title="현재 공정 구조를 공정 레퍼런스에 저장"
                >
                  {saveTemplateMutation.isPending ? '⏳ 저장 중...' : '📥 공정 레퍼런스 저장'}
                </S.SaveTemplateBtn>

              </>
            ) : (
              <S.EmptyMsg style={{ padding: '40px 0' }}>
                대공정을<br />먼저 추가하세요.
              </S.EmptyMsg>
            )}
          </S.RightSidebarWrapper>

          {/* [ANCHOR] 기존 체크리스트 본문 - 원형 그대로 보존 */}



          {/* 대공정 무한 스크롤형 레이아웃 */}
          {isLoading ? (
            <S.EmptyMsg>불러오는 중...</S.EmptyMsg>
          ) : majorProcesses.length === 0 ? (
            <S.EmptyMsg>{'등록된 공정이 없습니다.\n아래에서 대공정을 추가하세요.'}</S.EmptyMsg>
          ) : (
            <div>
              {majorProcesses.map((major) => (
                <S.MajorSection
                  key={major.id}
                  id={`major-section-${major.id}`}
                  $selected={selectedMajorIdForOrder === major.id}
                >
                  <S.MajorHeader
                    onClick={(e) => {
                      // 버튼 클릭은 선택 토글 무시
                      if (e.target.closest('button')) return;
                      setActiveMajorId(major.id);
                      scrollToSidebarNav(major.id);
                      setSelectedMajorIdForOrder(prev => prev === major.id ? null : major.id);
                      setSelectedMinorId(null); // 대공정 선택 시 소공정 선택 해제
                    }}
                  >
                    <S.MajorTitle>
                      {major.name}
                      {selectedMajorIdForOrder === major.id && (
                        <S.KeyboardHint>↑↓ 이동</S.KeyboardHint>
                      )}
                      <S.MajorCheckBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          const sectionEl = document.getElementById(`major-section-${major.id}`);
                          if (sectionEl) {
                            const y = sectionEl.getBoundingClientRect().top + window.scrollY - 70;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                        }}
                        done={activeMajor?.id === major.id}
                        title="해당 공정으로 이동하여 활성화"
                      >
                        ✓
                      </S.MajorCheckBtn>
                    </S.MajorTitle>
                    <S.DeleteMajorBtn onClick={(e) => { e.stopPropagation(); handleDeleteMajor(major.id, major.name); }}>
                      삭제
                    </S.DeleteMajorBtn>
                  </S.MajorHeader>
                  <S.MajorDivider />

                  {/* 소공정 리스트 렌더링 (이전의 MinorProcessSheet 내용 이관) */}
                  <div style={{ marginTop: '12px' }}>
                    <InlineMinorProcessList
                      major={major}
                      projectId={selectedProjectId}
                      onUpdate={() => qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] })}
                      selectedMinorId={selectedMinorId}
                      onSelectMinor={(id) => {
                        setSelectedMinorId(id);
                        setSelectedMajorIdForOrder(null); // 소공정 선택 시 대공정 선택 해제
                      }}
                    />
                  </div>
                </S.MajorSection>
              ))}
            </div>
          )}

          {/* (대공정 추가 버튼은 우측 패널로 이동됨) */}
        </>
      )}

      {/* 바텀네비게이션에 리스트 하단이 가려지는 것을 방지 */}
      <div style={{ height: '80px' }} />

      <BottomNav />

      {/* 현장 생성 바텀시트 */}
      {showCreateSheet && (
        <CreateProjectSheet
          preselectedTemplateId={preselectedTemplateId}
          onClose={() => setShowCreateSheet(false)}
          onCreated={(newProject) => {
            qc.invalidateQueries({ queryKey: ['projects'] });
            setSelectedProjectId(newProject.id);
            setShowCreateSheet(false);
          }}
        />
      )}

      {/* 현장 수정 바텀시트 */}
      {showEditSheet && selectedProject && (
        <EditProjectSheet
          project={selectedProject}
          onClose={() => setShowEditSheet(false)}
          onUpdated={() => {
            qc.invalidateQueries({ queryKey: ['projects'] });
            setShowEditSheet(false);
          }}
        />
      )}

      {/* 커스텀 프롬프트 모달 — window.prompt 대체 */}
      {promptState.open && (
        <S.PromptOverlay onClick={handlePromptCancel}>
          <S.PromptBox onClick={(e) => e.stopPropagation()}>
            <S.PromptMessage>{promptState.message}</S.PromptMessage>
            <S.PromptInput
              autoFocus
              value={promptState.value}
              onChange={(e) => setPromptState((p) => ({ ...p, value: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePromptConfirm(); if (e.key === 'Escape') handlePromptCancel(); }}
            />
            <S.PromptActions>
              <S.PromptBtn onClick={handlePromptCancel}>취소</S.PromptBtn>
              <S.PromptBtn $primary onClick={handlePromptConfirm}>확인</S.PromptBtn>
            </S.PromptActions>
          </S.PromptBox>
        </S.PromptOverlay>
      )}
    </S.Page>
  );
}

/**
 * 인라인 소공정 리스트 (화면에 바로 나열)
 */
function InlineMinorProcessList({ major, projectId, onUpdate, selectedMinorId, onSelectMinor }) {
  const qc = useQueryClient();
  const [openMemoId, setOpenMemoId] = useState(null);
  const [memoDraft, setMemoDraft] = useState('');
  /* 상태 팝오버가 열려 있는 소공정 ID */
  const [openStatusId, setOpenStatusId] = useState(null);

  const setStatusMutation = useMutation({
    mutationFn: ({ minorId, newStatus }) => setMinorStatus(projectId, minorId, newStatus),
    onSuccess: onUpdate,
  });

  const todayMutation = useMutation({
    mutationFn: ({ minorId, currentIsToday }) => toggleToday(projectId, minorId, currentIsToday),
    onSuccess: () => {
      onUpdate();
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const memoMutation = useMutation({
    mutationFn: ({ minorId, memo }) => updateMinorMemo(projectId, minorId, memo),
    onSuccess: () => {
      onUpdate();
      setOpenMemoId(null);
    },
  });

  const addMinorMutation = useMutation({
    mutationFn: ({ majorId, name, memo }) => addMinorProcess(projectId, majorId, name, memo),
    onSuccess: onUpdate,
  });

  const delMinorMutation = useMutation({
    mutationFn: (minorId) => deleteMinorProcess(projectId, minorId),
    onSuccess: onUpdate,
  });

  const handleGoReport = async (minor) => {
    const today = new Date().toLocaleDateString('sv-SE');
    try {
      await createReport(projectId, {
        reportDate: today,
        weather: '맑음',
        minorProcessIds: [minor.id],
      });
      // staleTime(30초) 무시하고 연관 페이지 모두 즉시 강제 재조회
      qc.invalidateQueries({ queryKey: ['reports', projectId] });
      qc.invalidateQueries({ queryKey: ['report-today', projectId] });
      qc.refetchQueries({ queryKey: ['checklist', projectId] });
      qc.refetchQueries({ queryKey: ['dashboard', projectId] });
    } catch (err) {
      alert('일지 저장 실패: ' + (err.response?.data || err.message));
    }
  };

  /** ✅ 버튼 — 오늘 일지에서 해당 소공정을 제거 */
  const handleRemoveFromReport = async (minorId) => {
    try {
      await removeMinorFromTodayReport(projectId, minorId);
      // staleTime(30초) 무시하고 연관 페이지 모두 즉시 강제 재조회
      qc.invalidateQueries({ queryKey: ['reports', projectId] });
      qc.invalidateQueries({ queryKey: ['report-today', projectId] });
      qc.refetchQueries({ queryKey: ['checklist', projectId] });
      qc.refetchQueries({ queryKey: ['dashboard', projectId] });
    } catch (err) {
      alert('일지 제거 실패: ' + err.message);
    }
  };

  // ✎ 메모 토글 — 열기/닫기 + 초안 세팅
  const handleToggleMemo = (minor) => {
    if (openMemoId === minor.id) {
      setOpenMemoId(null);
    } else {
      setOpenMemoId(minor.id);
      setMemoDraft(minor.memo ?? '');
    }
  };

  // 메모 저장
  const handleSaveMemo = (minorId) => {
    memoMutation.mutate({ minorId, memo: memoDraft });
  };

  const handleDeleteMinor = (minorId, minorName) => {
    if (!window.confirm(`'${minorName}' 소공정을 삭제할까요?`)) return;
    delMinorMutation.mutate(minorId);
  };

  const minors = major.minorProcesses ?? [];

  return (
    <div>
      <S.MainMinorList>
        {minors.length === 0 ? (
          <S.EmptyMsg style={{ padding: '20px 0' }}>소공정이 없습니다.</S.EmptyMsg>
        ) : (
          minors.map((minor) =>
            minor.name === DIVIDER_NAME ? (
              <S.DividerItem key={minor.id}>
                <S.DividerLine />
                <S.DeleteIconBtn onClick={() => delMinorMutation.mutate(minor.id)} title="구분선 삭제">✕</S.DeleteIconBtn>
              </S.DividerItem>
            ) : (
              <S.MinorItem
                key={minor.id}
                $selected={selectedMinorId === minor.id}
                onClick={(e) => {
                  // 버튼 클릭은 선택 토글 무시
                  if (e.target.closest('button')) return;
                  onSelectMinor(selectedMinorId === minor.id ? null : minor.id);
                }}
              >
                <S.MinorRow>
                  <div style={{ position: 'relative' }}>
                    <S.StatusBtn
                      status={minor.status}
                      onClick={() => setOpenStatusId(openStatusId === minor.id ? null : minor.id)}
                    >
                      {STATUS_LABEL[minor.status] ?? minor.status}
                    </S.StatusBtn>
                    {openStatusId === minor.id && (
                      <S.StatusPopover>
                        {['WAITING', 'IN_PROGRESS', 'TOUCH_UP', 'DONE']
                          .filter((st) => st !== minor.status)
                          .map((st) => (
                            <S.StatusOption
                              key={st}
                              status={st}
                              onClick={() => {
                                setStatusMutation.mutate({ minorId: minor.id, newStatus: st });
                                setOpenStatusId(null);
                              }}
                            >
                              {STATUS_LABEL[st]}
                            </S.StatusOption>
                          ))}
                      </S.StatusPopover>
                    )}
                  </div>
                  <S.MinorName>{minor.name}</S.MinorName>
                  {selectedMinorId === minor.id && (
                    <S.KeyboardHint>↑↓</S.KeyboardHint>
                  )}
                  <S.TodayBtn active={minor.isToday} onClick={() => todayMutation.mutate({ minorId: minor.id, currentIsToday: minor.isToday })} title={minor.isToday ? '오늘 할 일에서 제거' : '오늘 할 일로 추가'}>★</S.TodayBtn>

                  {/* 일지에 추가 / 제거 토글 버튼 */}
                  <S.TaskReportBtn
                    reported={minor.isReported}
                    onClick={() => {
                      if (minor.isReported) {
                        handleRemoveFromReport(minor.id);
                      } else {
                        handleGoReport(minor);
                      }
                    }}
                    title={minor.isReported ? '일지에서 제거' : '일지에 추가'}
                  >
                    {minor.isReported ? '✅' : '📝'}
                  </S.TaskReportBtn>

                  <S.MemoToggleBtn active={!!minor.memo || openMemoId === minor.id} onClick={() => handleToggleMemo(minor)} title="메모">✎</S.MemoToggleBtn>
                  <S.DeleteIconBtn onClick={() => handleDeleteMinor(minor.id, minor.name)}>✕</S.DeleteIconBtn>
                </S.MinorRow>

                {openMemoId !== minor.id && minor.memo && <S.MemoPreview>{minor.memo}</S.MemoPreview>}

                {openMemoId === minor.id && (
                  <S.MemoArea>
                    <S.MemoTextarea autoFocus placeholder="메모를 입력하세요..." value={memoDraft} onChange={(e) => setMemoDraft(e.target.value)} />
                    <S.MemoBtnCol>
                      <S.MemoSaveBtn onClick={() => handleSaveMemo(minor.id)}>저장</S.MemoSaveBtn>
                      <S.MemoCancelBtn onClick={() => setOpenMemoId(null)}>취소</S.MemoCancelBtn>
                    </S.MemoBtnCol>
                  </S.MemoArea>
                )}

              </S.MinorItem>
            )
          )
        )}
      </S.MainMinorList>
    </div>
  );
}

/* CreateProjectSheet — 공통 컴포넌트로 분리됨 (src/components/common/CreateProjectSheet.jsx) */

/**
 * 현장 정보 수정 바텀시트
 * - 이름/주소/착공일/준공예정일 수정 가능
 * - 공정 구조는 변경 불가
 */
function EditProjectSheet({ project, onClose, onUpdated }) {
  const [name, setName] = useState(project.name);
  const [address, setAddress] = useState(project.address ?? '');
  const [startDate, setStartDate] = useState(project.startDate ?? '');
  const [endDate, setEndDate] = useState(project.endDate ?? '');
  const [saving, setSaving] = useState(false);

  const isValid = name.trim() && startDate && endDate;

  const handleSubmit = async () => {
    if (!isValid) return;
    if (new Date(endDate) < new Date(startDate)) {
      alert('준공예정일은 착공일 이후여야 합니다.');
      return;
    }
    setSaving(true);
    try {
      await updateProject(project.id, {
        name: name.trim(),
        address: address.trim() || undefined,
        startDate,
        endDate,
      });
      onUpdated();
    } catch (err) {
      alert('수정 실패: ' + (err.response?.data || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <S.Overlay onClick={onClose}>
      <S.FormSheet onClick={(e) => e.stopPropagation()}>
        <S.FormSheetHeader>
          <S.FormSheetTitle>현장 정보 수정</S.FormSheetTitle>
          <S.CloseBtn onClick={onClose}>✕</S.CloseBtn>
        </S.FormSheetHeader>

        <S.FormSheetBody>
          <S.FormGroup>
            <S.FormLabel>현장명 <S.FormRequired>*</S.FormRequired></S.FormLabel>
            <S.FormInput
              placeholder="예) 강남 공장동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </S.FormGroup>

          <S.FormGroup>
            <S.FormLabel>주소</S.FormLabel>
            <S.FormInput
              placeholder="예) 서울 강남구 테헤란로 123"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </S.FormGroup>

          <S.FormRow>
            <S.FormGroup>
              <S.FormLabel>착공일 <S.FormRequired>*</S.FormRequired></S.FormLabel>
              <S.FormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </S.FormGroup>
            <S.FormGroup>
              <S.FormLabel>준공예정일 <S.FormRequired>*</S.FormRequired></S.FormLabel>
              <S.FormInput
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </S.FormGroup>
          </S.FormRow>

          <S.SubmitBtn onClick={handleSubmit} disabled={!isValid || saving}>
            {saving ? '저장 중...' : '수정 완료'}
          </S.SubmitBtn>
        </S.FormSheetBody>
      </S.FormSheet>
    </S.Overlay>
  );
}
