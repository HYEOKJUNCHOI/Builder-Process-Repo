import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  reorderAllMinors,
  reorderMajorProcess,
} from './Checklist.api';
import { fetchMyProjects, saveProjectAsTemplate } from '../Dashboard/Dashboard.api';
import CreateProjectSheet from '../../components/common/CreateProjectSheet';
import { createReport, removeMinorFromTodayReport } from '../Report/Report.api';
import { useWeather } from '../../hooks/useWeather';
import useT from '../../i18n/useT';
import * as S from './Checklist.style';

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
  const { t, lang } = useT();

  // STATUS_LABEL은 t를 참조하므로 컴포넌트 함수 내부에서 선언
  const STATUS_LABEL = {
    WAITING: t.statusWaiting,
    IN_PROGRESS: t.statusInProgress,
    TOUCH_UP: t.statusTouchUp,
    DONE: t.statusDone,
  };
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
      alert(t.templateSaved);
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const handleSaveAsTemplate = async () => {
    if (!selectedProjectId || !selectedProject) return;
    const name = await showPrompt(t.templateNamePrompt, selectedProject.name ?? '');
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
    if (!window.confirm(t.deleteProjectConfirm(selectedProject.name))) return;
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
    if (!window.confirm(t.deleteMajorConfirm(majorName))) return;
    // projectId를 함께 네여야 Firestore 경로가 올바르게 구성됨
    delMajorMutation.mutate({ projectId: selectedProjectId, majorId });
  };

  /* ── 대공정 키보드 ↑↓ 이동용 선택 상태 ── */
  const [selectedMajorIdForOrder, setSelectedMajorIdForOrder] = useState(null);

  /* 키보드 ↑↓로 대공정 이동 (소공정은 항목 옆 버튼 클릭으로 이동) */
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // 인풋 계열에서는 기본 동작 유지
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

      const direction = e.key === 'ArrowUp' ? -1 : 1;

      if (selectedMajorIdForOrder) {
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
  }, [selectedMajorIdForOrder, majorProcesses, selectedProjectId]);

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
          <S.HeaderTitle>{t.checklistTitle}</S.HeaderTitle>
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
                  {t.tomorrow} {tomorrow.emoji} {tomorrow.text} {tomorrow.tempMax}°/{tomorrow.tempMin}°
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
          <S.EmptyMsg>{t.noSite}</S.EmptyMsg>
          <S.NewProjectBtn onClick={() => setShowCreateSheet(true)}>
            + {t.selectSite}
          </S.NewProjectBtn>
        </>
      )}

      {/* 현장 있을 때 */}
      {projects.length > 0 && (
        <>
          {/* [LEFT] 좌측 내비게이션 - floating */}
          <S.LeftSidebarWrapper>
            {/* 타이틀: 스크롤해도 항상 상단 고정 */}
            <S.RightPanelTitle style={{ padding: '0 14px', marginBottom: '8px', flexShrink: 0 }}>{t.checklistMajorList}</S.RightPanelTitle>
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
            <S.RightPanelTitle>{t.checklistAddTask}</S.RightPanelTitle>

            {/* 새 현장 추가 버튼 (상단 배치) */}
            <S.SidebarActionBtn onClick={() => setShowCreateSheet(true)}>
              + {t.selectSite}
            </S.SidebarActionBtn>

            {/* 대공정 추가 폼 or 버튼 (상단 배치) */}
            {addingMajor ? (
              /* 사이드바(200px) 안에서는 세로 스택으로 배치 */
              <S.SidebarAddForm>
                {/* GlobalAddInput: width:100% 명시되어 있어 column flex 안에서도 꽉 참 */}
                <S.GlobalAddInput
                  autoFocus
                  placeholder={t.addMajorPlaceholder}
                  value={majorInputValue}
                  onChange={(e) => setMajorInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMajorSubmit();
                    if (e.key === 'Escape') { setAddingMajor(false); setMajorInputValue(''); }
                  }}
                />
                <S.SidebarAddActions>
                  <S.AddConfirmBtn style={{ flex: 1 }} onClick={handleAddMajorSubmit}>{t.add}</S.AddConfirmBtn>
                  <S.AddCancelBtn onClick={() => { setAddingMajor(false); setMajorInputValue(''); }}>{t.cancel}</S.AddCancelBtn>
                </S.SidebarAddActions>
              </S.SidebarAddForm>
            ) : (
              selectedProjectId && (
                <S.SidebarActionBtn onClick={() => { setAddingMajor(true); setMajorInputValue(''); }}>
                  + {t.addMajor}
                </S.SidebarActionBtn>
              )
            )}

            <S.MajorDivider style={{ margin: '8px 0', borderTop: '1px dashed #E2E8F0' }} />

            <S.RightPanelTitle>{t.addMinor}</S.RightPanelTitle>
            {majorProcesses.length > 0 ? (
              <>
                {/* 스크롤 스파이가 자동으로 활성 대공정을 표시 */}
                <S.TargetMajorBadge data-qa="checklist-minor-major-badge">
                  {activeMajor?.name ?? '—'}
                </S.TargetMajorBadge>
                <S.GlobalAddFormGroup>
                  <S.GlobalAddLabel>{t.addMinorPlaceholder}</S.GlobalAddLabel>
                  <S.GlobalAddInput
                    placeholder={t.addMinorPlaceholder}
                    value={globalMinorName}
                    onChange={(e) => setGlobalMinorName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleGlobalAddMinor(); }}
                  />
                </S.GlobalAddFormGroup>
                <S.GlobalAddFormGroup>
                  <S.GlobalAddLabel>{t.checklistMemoOptional}</S.GlobalAddLabel>
                  <S.GlobalAddTextarea
                    placeholder={t.memoPlaceholder}
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
                  {saveTemplateMutation.isPending ? `⏳ ${t.processing}` : `📥 ${t.saveAsTemplate}`}
                </S.SaveTemplateBtn>

              </>
            ) : (
              <S.EmptyMsg style={{ padding: '40px 0' }}>
                {t.checklistAddMajorFirst.split('\n').map((line, i) => (
                  <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
                ))}
              </S.EmptyMsg>
            )}
          </S.RightSidebarWrapper>

          {/* [ANCHOR] 기존 체크리스트 본문 - 원형 그대로 보존 */}



          {/* 대공정 무한 스크롤형 레이아웃 */}
          {isLoading ? (
            <S.EmptyMsg>{t.loading}</S.EmptyMsg>
          ) : majorProcesses.length === 0 ? (
            <S.EmptyMsg>{t.noMajorProcess}</S.EmptyMsg>
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
                    }}
                  >
                    <S.MajorTitle>
                      {major.name}
                      {selectedMajorIdForOrder === major.id && (
                        <S.KeyboardHint>{t.majorMoveHint}</S.KeyboardHint>
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
                      {t.delete}
                    </S.DeleteMajorBtn>
                  </S.MajorHeader>
                  <S.MajorDivider />

                  {/* 소공정 리스트 렌더링 (이전의 MinorProcessSheet 내용 이관) */}
                  <div style={{ marginTop: '12px' }}>
                    <InlineMinorProcessList
                      major={major}
                      projectId={selectedProjectId}
                      onUpdate={() => qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] })}
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
              <S.PromptBtn onClick={handlePromptCancel}>{t.cancel}</S.PromptBtn>
              <S.PromptBtn $primary onClick={handlePromptConfirm}>{t.confirm}</S.PromptBtn>
            </S.PromptActions>
          </S.PromptBox>
        </S.PromptOverlay>
      )}
    </S.Page>
  );
}

/**
 * 드래그 가능한 단일 소공정 행 — useSortable로 dnd-kit 드래그 핸들링
 */
function SortableMinorItem({ minor, STATUS_LABEL, t, openMemoId, memoDraft, openStatusId, setOpenStatusId, setStatusMutation, todayMutation, handleGoReport, handleRemoveFromReport, handleToggleMemo, handleSaveMemo, handleDeleteMinor, setMemoDraft, setOpenMemoId, delMinorMutation }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: minor.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <S.MinorItem
      ref={setNodeRef}
      style={style}
      $selected={false}
    >
      <S.MinorRow>
        {/* 드래그 핸들 — ⠿ 아이콘을 잡고 드래그 */}
        <S.DragHandle {...attributes} {...listeners} title="드래그하여 순서 변경">⠿</S.DragHandle>

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
        <S.TodayBtn active={minor.isToday} onClick={() => todayMutation.mutate({ minorId: minor.id, currentIsToday: minor.isToday })} title={minor.isToday ? t.removeFromToday : t.addToToday}>★</S.TodayBtn>

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
          title={minor.isReported ? t.removeFromReport : t.addToReport}
        >
          {minor.isReported ? '✅' : '📝'}
        </S.TaskReportBtn>

        <S.MemoToggleBtn active={!!minor.memo || openMemoId === minor.id} onClick={() => handleToggleMemo(minor)} title={t.checklistMemoTitle}>✎</S.MemoToggleBtn>
        <S.DeleteIconBtn onClick={() => handleDeleteMinor(minor.id, minor.name)}>✕</S.DeleteIconBtn>
      </S.MinorRow>

      {openMemoId !== minor.id && minor.memo && <S.MemoPreview>{minor.memo}</S.MemoPreview>}

      {openMemoId === minor.id && (
        <S.MemoArea>
          <S.MemoTextarea autoFocus placeholder={t.memoPlaceholder} value={memoDraft} onChange={(e) => setMemoDraft(e.target.value)} />
          <S.MemoBtnCol>
            <S.MemoSaveBtn onClick={() => handleSaveMemo(minor.id)}>{t.save}</S.MemoSaveBtn>
            <S.MemoCancelBtn onClick={() => setOpenMemoId(null)}>{t.cancel}</S.MemoCancelBtn>
          </S.MemoBtnCol>
        </S.MemoArea>
      )}
    </S.MinorItem>
  );
}

/**
 * 인라인 소공정 리스트 (화면에 바로 나열) — dnd-kit 드래그 앤 드롭 정렬
 */
function InlineMinorProcessList({ major, projectId, onUpdate }) {
  const qc = useQueryClient();
  const { t } = useT();

  // STATUS_LABEL은 t를 참조하므로 컴포넌트 함수 내부에서 선언
  const STATUS_LABEL = {
    WAITING: t.statusWaiting,
    IN_PROGRESS: t.statusInProgress,
    TOUCH_UP: t.statusTouchUp,
    DONE: t.statusDone,
  };

  const [openMemoId, setOpenMemoId] = useState(null);
  const [memoDraft, setMemoDraft] = useState('');
  /* 상태 팝오버가 열려 있는 소공정 ID */
  const [openStatusId, setOpenStatusId] = useState(null);

  /* dnd-kit 센서: 마우스(5px 이상 이동 후 시작) + 터치(250ms 지연으로 스크롤과 충돌 방지) */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  /* 드래그 완료 — 낙관적 캐시 업데이트 후 Firestore 배치 저장 */
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const minors = major.minorProcesses ?? [];
    const oldIndex = minors.findIndex((m) => m.id === active.id);
    const newIndex = minors.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // 낙관적 UI: 캐시에서 해당 대공정의 소공정 배열을 즉시 재정렬
    const reordered = arrayMove(minors, oldIndex, newIndex);
    qc.setQueryData(['checklist', projectId], (old) => {
      if (!old) return old;
      return {
        ...old,
        majorProcesses: old.majorProcesses.map((m) =>
          m.id === major.id ? { ...m, minorProcesses: reordered } : m
        ),
      };
    });

    // Firestore 배치 저장 — 에러 시 서버 상태로 복구
    try {
      await reorderAllMinors(projectId, reordered);
    } catch (err) {
      alert(t.minorOrderError + err.message);
      onUpdate(); // 서버 상태로 복구
    }
  };

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

  const handleSaveMemo = (minorId) => {
    memoMutation.mutate({ minorId, memo: memoDraft });
  };

  const handleDeleteMinor = (minorId) => {
    if (!window.confirm(t.checklistDeleteMinorConfirm)) return;
    delMinorMutation.mutate(minorId);
  };

  const minors = major.minorProcesses ?? [];
  /* 드래그 대상: 구분선이 아닌 일반 소공정 ID만 SortableContext에 등록 */
  const sortableIds = minors.filter((m) => m.name !== DIVIDER_NAME).map((m) => m.id);

  return (
    <div>
      <S.MainMinorList>
        {minors.length === 0 ? (
          <S.EmptyMsg style={{ padding: '20px 0' }}>{t.checklistNoMinor}</S.EmptyMsg>
        ) : (
          /* DndContext: 드래그 컨텍스트 — 이 범위 안에서만 드래그 가능 */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {minors.map((minor) =>
                minor.name === DIVIDER_NAME ? (
                  /* 구분선은 드래그 제외 — 일반 렌더링 */
                  <S.DividerItem key={minor.id}>
                    <S.DividerLine />
                    <S.DeleteIconBtn onClick={() => delMinorMutation.mutate(minor.id)} title={t.checklistDeleteDividerTitle}>✕</S.DeleteIconBtn>
                  </S.DividerItem>
                ) : (
                  <SortableMinorItem
                    key={minor.id}
                    minor={minor}
                    STATUS_LABEL={STATUS_LABEL}
                    t={t}
                    openMemoId={openMemoId}
                    memoDraft={memoDraft}
                    openStatusId={openStatusId}
                    setOpenStatusId={setOpenStatusId}
                    setStatusMutation={setStatusMutation}
                    todayMutation={todayMutation}
                    handleGoReport={handleGoReport}
                    handleRemoveFromReport={handleRemoveFromReport}
                    handleToggleMemo={handleToggleMemo}
                    handleSaveMemo={handleSaveMemo}
                    handleDeleteMinor={handleDeleteMinor}
                    setMemoDraft={setMemoDraft}
                    setOpenMemoId={setOpenMemoId}
                    delMinorMutation={delMinorMutation}
                  />
                )
              )}
            </SortableContext>
          </DndContext>
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
  const { t, lang } = useT();
  const [name, setName] = useState(project.name);
  const [address, setAddress] = useState(project.address ?? '');
  const [startDate, setStartDate] = useState(project.startDate ?? '');
  const [endDate, setEndDate] = useState(project.endDate ?? '');
  const [saving, setSaving] = useState(false);

  const isValid = name.trim() && startDate && endDate;

  const handleSubmit = async () => {
    if (!isValid) return;
    if (new Date(endDate) < new Date(startDate)) {
      alert(t.editSiteEndError);
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
          <S.FormSheetTitle>{t.editProjectTitle}</S.FormSheetTitle>
          <S.CloseBtn onClick={onClose}>✕</S.CloseBtn>
        </S.FormSheetHeader>

        <S.FormSheetBody>
          <S.FormGroup>
            <S.FormLabel>{t.editSiteName} <S.FormRequired>*</S.FormRequired></S.FormLabel>
            <S.FormInput
              placeholder={t.editSiteNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </S.FormGroup>

          <S.FormGroup>
            <S.FormLabel>{t.editSiteAddress}</S.FormLabel>
            <S.FormInput
              placeholder={t.editSiteAddressPlaceholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </S.FormGroup>

          <S.FormRow>
            <S.FormGroup>
              <S.FormLabel>{t.editSiteStart} <S.FormRequired>*</S.FormRequired></S.FormLabel>
              <S.FormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </S.FormGroup>
            <S.FormGroup>
              <S.FormLabel>{t.editSiteEnd} <S.FormRequired>*</S.FormRequired></S.FormLabel>
              <S.FormInput
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </S.FormGroup>
          </S.FormRow>

          <S.SubmitBtn onClick={handleSubmit} disabled={!isValid || saving}>
            {saving ? t.processing : t.editSiteConfirm}
          </S.SubmitBtn>
        </S.FormSheetBody>
      </S.FormSheet>
    </S.Overlay>
  );
}
