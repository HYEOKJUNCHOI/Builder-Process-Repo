import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomNav from '../../components/layout/BottomNav';
import MajorProcessCard from '../../components/common/MajorProcessCard';
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
import { createReport } from '../Report/Report.api';
import { useWeather } from '../../hooks/useWeather';
import * as S from './Checklist.style';

const STATUS_LABEL = {
  WAITING:     '대기',
  IN_PROGRESS: '진행',
  TOUCH_UP:    '마무리',
  DONE:        '완료',
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
  const [activeMajor, setActiveMajor] = useState(null); // 바텀시트에 표시할 대공정
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [addingMajor, setAddingMajor] = useState(false);
  const [majorInputValue, setMajorInputValue] = useState('');

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
      setActiveMajor(null);
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

  /* 대공정 삭제 */
  const delMajorMutation = useMutation({
    mutationFn: deleteMajorProcess,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
      setActiveMajor(null);
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

  // 바텀시트에 표시할 최신 대공정 데이터를 체크리스트에서 실시간 동기화
  const activeMajorData = activeMajor
    ? majorProcesses.find((m) => m.id === activeMajor.id) ?? activeMajor
    : null;

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
                  setActiveMajor(null);
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
          {/* 새 현장 추가 버튼 */}
          <S.AddBtn onClick={() => setShowCreateSheet(true)}>
            + 새 현장 추가
          </S.AddBtn>

          {/* 대공정 카드 그리드 */}
          {isLoading ? (
            <S.EmptyMsg>불러오는 중...</S.EmptyMsg>
          ) : majorProcesses.length === 0 ? (
            <S.EmptyMsg>{'등록된 공정이 없습니다.\n아래에서 대공정을 추가하세요.'}</S.EmptyMsg>
          ) : (
            <S.CardGrid>
              {majorProcesses.map((major) => (
                <MajorProcessCard
                  key={major.id}
                  major={major}
                  onClick={() => setActiveMajor(major)}
                  onDelete={handleDeleteMajor}
                />
              ))}
            </S.CardGrid>
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

      <BottomNav />

      {/* 소공정 바텀시트 */}
      {activeMajorData && (
        <MinorProcessSheet
          major={activeMajorData}
          projectId={selectedProjectId}
          onClose={() => setActiveMajor(null)}
          onDeleteMajor={handleDeleteMajor}
          onUpdate={() => qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] })}
        />
      )}

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
 * 소공정 바텀시트
 * - 소공정 목록, 상태순환, 오늘할일 토글, 삭제
 * - 하단 고정 입력창으로 소공정 추가
 */
function MinorProcessSheet({ major, projectId, onClose, onDeleteMajor, onUpdate }) {
  const qc = useQueryClient();
  const [newMinorName, setNewMinorName] = useState('');
  const [newMinorMemo, setNewMinorMemo] = useState('');
  // 메모 편집 중인 소공정 ID와 초안 값
  const [openMemoId, setOpenMemoId] = useState(null);
  const [memoDraft, setMemoDraft] = useState('');

  const statusMutation = useMutation({
    mutationFn: cycleStatus,
    onSuccess: onUpdate,
  });

  const todayMutation = useMutation({
    mutationFn: toggleToday,
    onSuccess: () => {
      onUpdate();
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const memoMutation = useMutation({
    mutationFn: ({ minorId, memo }) => updateMinorMemo(minorId, memo),
    onSuccess: () => {
      onUpdate();
      setOpenMemoId(null);
    },
  });

  const addMinorMutation = useMutation({
    mutationFn: ({ majorId, name, memo }) => addMinorProcess(majorId, name, memo),
    onSuccess: () => { onUpdate(); setNewMinorName(''); setNewMinorMemo(''); },
  });

  const delMinorMutation = useMutation({
    mutationFn: deleteMinorProcess,
    onSuccess: onUpdate,
  });

  const handleAddMinor = () => {
    if (!newMinorName.trim()) return;
    addMinorMutation.mutate({ majorId: major.id, name: newMinorName.trim(), memo: newMinorMemo });
  };

  const handleDeleteMinor = (minorId, minorName) => {
    if (!window.confirm(`'${minorName}' 소공정을 삭제할까요?`)) return;
    delMinorMutation.mutate(minorId);
  };

  const handleToggleMemo = (minor) => {
    if (openMemoId === minor.id) {
      // 이미 열려 있으면 닫기
      setOpenMemoId(null);
    } else {
      setOpenMemoId(minor.id);
      setMemoDraft(minor.memo ?? '');
    }
  };

  const handleSaveMemo = (minorId) => {
    memoMutation.mutate({ minorId, memo: memoDraft });
  };

  /** 📝 버튼 — 오늘 날짜로 해당 소공정을 일지에 즉시 저장 (navigate 없음) */
  const handleGoReport = async (minor) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await createReport(projectId, {
        reportDate:      today,
        weather:         '맑음',
        minorProcessIds: [minor.id],
      });
      // 일지 페이지의 오늘 보고서 캐시 갱신 — staleTime(30초) 내 이동 시 반영
      qc.invalidateQueries({ queryKey: ['report-today', projectId] });
      alert('일지에 내용이 추가되었습니다.');
    } catch (err) {
      alert('일지 저장 실패: ' + (err.response?.data || err.message));
    }
  };

  /** 구분선 추가 — DIVIDER_NAME 상수 문자열을 소공정 이름으로 삽입 */
  const handleAddDivider = () => {
    addMinorMutation.mutate({ majorId: major.id, name: DIVIDER_NAME, memo: '' });
  };

  const minors = major.minorProcesses ?? [];

  return (
    <S.Overlay onClick={onClose}>
      <S.Sheet onClick={(e) => e.stopPropagation()}>
        <S.SheetHeader>
          <S.SheetTitle>{major.name}</S.SheetTitle>
          <S.SheetActions>
            <S.DeleteMajorBtn onClick={() => onDeleteMajor(major.id, major.name)}>
              삭제
            </S.DeleteMajorBtn>
            <S.CloseBtn onClick={onClose}>✕</S.CloseBtn>
          </S.SheetActions>
        </S.SheetHeader>

        <S.SheetBody>
          <S.MinorList>
            {minors.length === 0 ? (
              <S.EmptyMsg style={{ padding: '32px 0' }}>소공정이 없습니다.</S.EmptyMsg>
            ) : (
              minors.map((minor) =>
                /* 구분선 렌더링 — DIVIDER_NAME 마커이면 가로선 + 삭제 버튼만 표시 */
                minor.name === DIVIDER_NAME ? (
                  <S.DividerItem key={minor.id}>
                    <S.DividerLine />
                    <S.DeleteIconBtn
                      onClick={() => delMinorMutation.mutate(minor.id)}
                      title="구분선 삭제"
                    >
                      ✕
                    </S.DeleteIconBtn>
                  </S.DividerItem>
                ) : (
                <S.MinorItem key={minor.id}>
                  {/* 상단 한 줄 — 상태·이름·★·📝·✎·✕ */}
                  <S.MinorRow>
                    <S.StatusBtn
                      status={minor.status}
                      onClick={() => statusMutation.mutate(minor.id)}
                    >
                      {STATUS_LABEL[minor.status] ?? minor.status}
                    </S.StatusBtn>
                    <S.MinorName>{minor.name}</S.MinorName>
                    <S.TodayBtn
                      active={minor.isToday}
                      onClick={() => todayMutation.mutate(minor.id)}
                      title={minor.isToday ? '오늘 할 일에서 제거' : '오늘 할 일로 추가'}
                    >
                      ★
                    </S.TodayBtn>
                    {/* 📝 일지 작성 — 클릭 시 일지 페이지로 이동하면서 해당 소공정 미리 선택 */}
                    <S.ReportIconBtn
                      onClick={() => handleGoReport(minor)}
                      title="일지에 추가"
                    >
                      📝
                    </S.ReportIconBtn>
                    {/* 메모 토글 버튼 — 메모 내용 있으면 강조 표시 */}
                    <S.MemoToggleBtn
                      active={!!minor.memo || openMemoId === minor.id}
                      onClick={() => handleToggleMemo(minor)}
                      title="메모"
                    >
                      ✎
                    </S.MemoToggleBtn>
                    <S.DeleteIconBtn onClick={() => handleDeleteMinor(minor.id, minor.name)}>
                      ✕
                    </S.DeleteIconBtn>
                  </S.MinorRow>

                  {/* 메모 미리보기 — 닫혀 있고 메모 있을 때만 */}
                  {openMemoId !== minor.id && minor.memo && (
                    <S.MemoPreview>{minor.memo}</S.MemoPreview>
                  )}

                  {/* 메모 편집 영역 — 해당 소공정 클릭 시 확장 */}
                  {openMemoId === minor.id && (
                    <S.MemoArea>
                      <S.MemoTextarea
                        autoFocus
                        placeholder="메모를 입력하세요..."
                        value={memoDraft}
                        onChange={(e) => setMemoDraft(e.target.value)}
                      />
                      <S.MemoSaveBtn onClick={() => handleSaveMemo(minor.id)}>
                        저장
                      </S.MemoSaveBtn>
                    </S.MemoArea>
                  )}
                </S.MinorItem>
                )
              )
            )}
          </S.MinorList>
        </S.SheetBody>

        {/* 하단 고정 소공정 추가 입력창 */}
        <S.SheetAddRow>
          <S.SheetAddTopRow>
            <S.SheetAddInput
              placeholder="소공정 이름..."
              value={newMinorName}
              onChange={(e) => setNewMinorName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddMinor(); }}
            />
            <S.SheetAddBtn onClick={handleAddMinor}>추가</S.SheetAddBtn>
          </S.SheetAddTopRow>
          {/* 메모 선택 입력 — 공백이면 저장하지 않음 */}
          <S.SheetMemoInput
            placeholder="메모 (선택)"
            value={newMinorMemo}
            onChange={(e) => setNewMinorMemo(e.target.value)}
          />
          {/* 구분선 추가 — 소공정 목록 사이에 시각적 구분선을 삽입 */}
          <S.SheetDividerBtn onClick={handleAddDivider}>
            ── 구분선 추가
          </S.SheetDividerBtn>
        </S.SheetAddRow>
      </S.Sheet>
    </S.Overlay>
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
