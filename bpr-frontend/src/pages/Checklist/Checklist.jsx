import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomNav from '../../components/layout/BottomNav';
import {
  fetchChecklist,
  cycleStatus,
  toggleToday,
  updateMinorMemo,
  addMajorProcess,
  addMinorProcess,
  deleteMajorProcess,
  deleteMinorProcess,
  updateProject,
  deleteProject,
} from './Checklist.api';
import { fetchMyProjects, fetchTemplates, createProject } from '../Dashboard/Dashboard.api';
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

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [addingMajor, setAddingMajor] = useState(false);
  const [majorInputValue, setMajorInputValue] = useState('');

  /* 3단 레이아웃용 상태 */
  const [activeMajorId, setActiveMajorId] = useState(null);
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

  /* 체크리스트 */
  const { data: checklist, isLoading } = useQuery({
    queryKey: ['checklist', selectedProjectId],
    queryFn: () => fetchChecklist(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const majorProcesses = checklist?.majorProcesses ?? [];

  // 현재 선택된 현장 데이터 (수정 시트 초기값으로 활용)
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  /* 현장 주소 기반 날씨 — 내일 예보 포함 */
  const { tomorrow } = useWeather(selectedProject?.address ?? null);

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
    mutationFn: deleteMajorProcess,
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
    delMajorMutation.mutate(majorId);
  };

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
  const handleScrollToMajor = (id) => {
    setActiveMajorId(id);
    const element = document.getElementById(`major-section-${id}`);
    if (element) {
      const headerOffset = 130;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = activeMajorId;
      for (const major of majorProcesses) {
        const el = document.getElementById(`major-section-${major.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            currentActiveId = major.id;
            break;
          }
        }
      }
      if (currentActiveId && currentActiveId !== activeMajorId) {
        setActiveMajorId(currentActiveId);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [majorProcesses, activeMajorId]);

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
                  setSelectedProjectId(Number(e.target.value));
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.address ? ` / ${p.address}` : ''}
                  </option>
                ))}
              </S.ProjectSelect>
              {tomorrow && (
                <S.TomorrowWeather>
                  내일 {tomorrow.emoji} {tomorrow.text} {tomorrow.tempMax}°/{tomorrow.tempMin}°
                </S.TomorrowWeather>
              )}
              {selectedProjectId && (
                <>
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
                </>
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
            <S.RightPanelTitle style={{ padding: '0 14px', marginBottom: '8px' }}>대공정 목록</S.RightPanelTitle>
            {majorProcesses.map((major) => (
              <S.NavItem
                key={`nav-${major.id}`}
                active={activeMajor?.id === major.id}
                onClick={() => handleScrollToMajor(major.id)}
              >
                {major.name}
              </S.NavItem>
            ))}
          </S.LeftSidebarWrapper>

          {/* [RIGHT] 공용 소공정 등록 패널 - floating */}
          <S.RightSidebarWrapper>
            <S.RightPanelTitle>소공정 등록</S.RightPanelTitle>
            {activeMajor ? (
              <>
                <S.TargetMajorBadge>{activeMajor.name}</S.TargetMajorBadge>
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

              </>
            ) : (
              <S.EmptyMsg style={{ padding: '40px 0' }}>
                활성화된 대공정이<br />없습니다.<br />
                <span style={{ fontSize: '12px', color: '#999' }}>(스크롤하거나 왼쪽에서 선택)</span>
              </S.EmptyMsg>
            )}
          </S.RightSidebarWrapper>

          {/* [ANCHOR] 기존 체크리스트 본문 - 원형 그대로 보존 */}
          {/* 새 현장 추가 버튼 */}
          <S.AddBtn onClick={() => setShowCreateSheet(true)}>
            + 새 현장 추가
          </S.AddBtn>



          {/* 대공정 무한 스크롤형 레이아웃 */}
          {isLoading ? (
            <S.EmptyMsg>불러오는 중...</S.EmptyMsg>
          ) : majorProcesses.length === 0 ? (
            <S.EmptyMsg>{'등록된 공정이 없습니다.\n아래에서 대공정을 추가하세요.'}</S.EmptyMsg>
          ) : (
            <div>
              {majorProcesses.map((major) => (
                <S.MajorSection key={major.id} id={`major-section-${major.id}`}>
                  <S.MajorHeader>
                    <S.MajorTitle>{major.name}</S.MajorTitle>
                    <S.DeleteMajorBtn onClick={() => handleDeleteMajor(major.id, major.name)}>
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
                    />
                  </div>
                </S.MajorSection>
              ))}
            </div>
          )}

          {/* 대공정 추가 */}
          {addingMajor ? (
            <S.AddRow>
              <S.AddInput
                autoFocus
                placeholder="대공정 이름"
                value={majorInputValue}
                onChange={(e) => setMajorInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddMajorSubmit();
                  if (e.key === 'Escape') { setAddingMajor(false); setMajorInputValue(''); }
                }}
              />
              <S.AddConfirmBtn onClick={handleAddMajorSubmit}>추가</S.AddConfirmBtn>
              <S.AddCancelBtn onClick={() => { setAddingMajor(false); setMajorInputValue(''); }}>취소</S.AddCancelBtn>
            </S.AddRow>
          ) : (
            selectedProjectId && (
              <S.AddBtn onClick={() => { setAddingMajor(true); setMajorInputValue(''); }}>
                + 대공정 추가
              </S.AddBtn>
            )
          )}
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
    </S.Page>
  );
}

/**
 * 인라인 소공정 리스트 (화면에 바로 나열)
 */
function InlineMinorProcessList({ major, projectId, onUpdate }) {
  const qc = useQueryClient();
  const [openMemoId, setOpenMemoId] = useState(null);
  const [memoDraft, setMemoDraft] = useState('');

  const statusMutation = useMutation({
    mutationFn: ({ minorId, currentStatus }) => cycleStatus(projectId, minorId, currentStatus),
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

  // 📝 일지 추가 — 오늘 날짜 + 기본 날씨로 소공정을 일지에 즉시 등록
  const handleGoReport = async (minor) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await createReport(projectId, {
        reportDate: today,
        weather: '맑음',
        minorProcessIds: [minor.id],
      });
      // 캐시 갱신
      qc.invalidateQueries({ queryKey: ['reports', projectId] });
      qc.invalidateQueries({ queryKey: ['report-today', projectId] });
      qc.invalidateQueries({ queryKey: ['checklist', projectId] });
    } catch (err) {
      alert('일지 저장 실패: ' + (err.response?.data || err.message));
    }
  };

  /** ✅ 버튼 — 오늘 일지에서 해당 소공정을 제거 */
  const handleRemoveFromReport = async (minorId) => {
    try {
      await removeMinorFromTodayReport(projectId, minorId);
      // 캐시 갱신
      qc.invalidateQueries({ queryKey: ['reports', projectId] });
      qc.invalidateQueries({ queryKey: ['report-today', projectId] });
      qc.invalidateQueries({ queryKey: ['checklist', projectId] });
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
              <S.MinorItem key={minor.id}>
                <S.MinorRow>
                  <S.StatusBtn status={minor.status} onClick={() => statusMutation.mutate({ minorId: minor.id, currentStatus: minor.status })}>
                    {STATUS_LABEL[minor.status] ?? minor.status}
                  </S.StatusBtn>
                  <S.MinorName>{minor.name}</S.MinorName>
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
                    <S.MemoSaveBtn onClick={() => handleSaveMemo(minor.id)}>저장</S.MemoSaveBtn>
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

/**
 * 현장 생성 바텀시트
 */
function CreateProjectSheet({ preselectedTemplateId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [templateId, setTemplateId] = useState(preselectedTemplateId ? String(preselectedTemplateId) : '');
  const [saving, setSaving] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  const isValid = name.trim() && startDate && endDate;

  const handleSubmit = async () => {
    if (!isValid) return;
    if (new Date(endDate) < new Date(startDate)) {
      alert('준공예정일은 착공일 이후여야 합니다.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || undefined,
        startDate,
        endDate,
        templateId: templateId ? Number(templateId) : undefined,
      };
      const newProject = await createProject(payload);
      onCreated(newProject);
    } catch (err) {
      alert('현장 생성 실패: ' + (err.response?.data || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <S.Overlay onClick={onClose}>
      <S.FormSheet onClick={(e) => e.stopPropagation()}>
        <S.FormSheetHeader>
          <S.FormSheetTitle>새 현장 만들기</S.FormSheetTitle>
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

          <S.FormGroup>
            <S.FormLabel>공정 템플릿</S.FormLabel>
            <S.FormSelect
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">선택 안 함 (빈 공정으로 시작)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isDefault ? '(기본)' : ''}
                </option>
              ))}
            </S.FormSelect>
          </S.FormGroup>

          <S.SubmitBtn onClick={handleSubmit} disabled={!isValid || saving}>
            {saving ? '생성 중...' : '현장 만들기'}
          </S.SubmitBtn>
        </S.FormSheetBody>
      </S.FormSheet>
    </S.Overlay>
  );
}

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
