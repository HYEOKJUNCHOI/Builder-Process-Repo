import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomNav from '../../components/layout/BottomNav';
import { fetchMyProjects, fetchDashboard } from './Dashboard.api';
import { cycleStatus, toggleToday, updateMinorMemo } from '../Checklist/Checklist.api';
import { createReport } from '../Report/Report.api';
import { useWeather } from '../../hooks/useWeather';
import StatsSection from '../../components/common/StatsSection';
import * as S from './Dashboard.style';

const STATUS_LABEL = {
  WAITING:     '대기',
  IN_PROGRESS: '진행',
  TOUCH_UP:    '마무리',
  DONE:        '완료',
};

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

/** useWeather 텍스트를 일지 날씨 옵션으로 매핑 */
function mapWeatherText(text) {
  if (!text) return '맑음';
  if (text.includes('비') || text.includes('소나기')) return '비';
  if (text.includes('눈')) return '눈';
  if (text.includes('흐림') || text.includes('구름')) return '흐림';
  if (text.includes('바람') || text.includes('강풍')) return '강풍';
  return '맑음';
}

/** 오늘 날짜 문자열 — "2025년 2월 22일 (토)" 형식 */
function formatToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const day = DAY_KO[now.getDay()];
  return `${y}년 ${m}월 ${d}일 (${day})`;
}

/**
 * 대시보드 페이지 — 오늘 할 일 표시
 * - 현장은 체크리스트에서 생성/관리
 * - 여기서는 현장 선택 + 오늘 할 일(★ 체크된 소공정) 조회만 담당
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  // 메모 편집 중인 소공정 ID와 초안
  const [openMemoId, setOpenMemoId] = useState(null);
  const [memoDraft, setMemoDraft] = useState('');

  /* 현장 목록 */
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchMyProjects,
  });

  /* 첫 로드 시 첫 번째 현장 자동 선택 */
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  /* 오늘 할 일 */
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard', selectedProjectId],
    queryFn: () => fetchDashboard(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  /* 현장 주소 기반 날씨 — 주소 없으면 null (GPS 미사용) */
  const { weather } = useWeather(selectedProject?.address ?? null);

  /* 대시보드 + 체크리스트 캐시 동시 갱신 — 양쪽 화면이 항상 동기화됨 */
  const invalidateBoth = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
    queryClient.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
  };

  /* 소공정 상태 순환 (WAITING → IN_PROGRESS → TOUCH_UP → DONE → ...) */
  const { mutate: doStatus } = useMutation({
    mutationFn: (minorId) => cycleStatus(minorId),
    onSuccess: invalidateBoth,
  });

  /* 오늘 할 일 토글 — 해제하면 대시보드 목록에서 제거됨 */
  const { mutate: doToday } = useMutation({
    mutationFn: (minorId) => toggleToday(minorId),
    onSuccess: invalidateBoth,
  });

  /* 메모 저장 */
  const { mutate: doMemo } = useMutation({
    mutationFn: ({ minorId, memo }) => updateMinorMemo(minorId, memo),
    onSuccess: () => {
      invalidateBoth();
      setOpenMemoId(null);
    },
  });

  const handleToggleMemo = (task) => {
    if (openMemoId === task.minorProcessId) {
      setOpenMemoId(null);
    } else {
      setOpenMemoId(task.minorProcessId);
      setMemoDraft(task.memo ?? '');
    }
  };

  /** 📝 버튼 — 오늘 날짜 + 현재 날씨로 해당 소공정을 일지에 즉시 저장 */
  const handleGoReport = async (task) => {
    const today = new Date().toISOString().slice(0, 10);
    const weatherOption = mapWeatherText(weather?.text);
    try {
      await createReport(selectedProjectId, {
        reportDate:       today,
        weather:          weatherOption,
        minorProcessIds:  [task.minorProcessId],
      });
      // 일지 페이지의 오늘 보고서 캐시도 갱신 — staleTime(30초) 내 이동 시 반영
      queryClient.invalidateQueries({ queryKey: ['reports', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['report-today', selectedProjectId] });
      alert('일지에 내용이 추가되었습니다.');
    } catch (err) {
      alert('일지 저장 실패: ' + (err.response?.data || err.message));
    }
  };

  return (
    <S.Page>
      {/* sticky 헤더 — 날짜/날씨(좌) + 현장 선택(우) — Checklist와 동일한 구조 */}
      <S.Header data-qa="dashboard-header">
        <S.HeaderLeft data-qa="dashboard-header-left">
          <S.DateText>{formatToday()}</S.DateText>
          {weather && (
            <S.WeatherText>
              {weather.emoji} {weather.text} · {weather.temp}°C
            </S.WeatherText>
          )}
        </S.HeaderLeft>
        {projects.length > 0 && (
          <S.ProjectSelect
            data-qa="dashboard-site-select"
            value={selectedProjectId ?? ''}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.address ? ` / ${p.address}` : ''}
              </option>
            ))}
          </S.ProjectSelect>
        )}
      </S.Header>

      <S.Content>

        {/* 현장이 없으면 체크리스트로 유도 */}
        {projects.length === 0 ? (
          <S.SectionBox>
            <S.EmptyMsg>
              등록된 현장이 없습니다.{'\n'}
              체크리스트 탭에서 현장을 먼저 만들어보세요.
            </S.EmptyMsg>
            <S.GoChecklistBtn onClick={() => navigate('/checklist')}>
              체크리스트로 이동
            </S.GoChecklistBtn>
          </S.SectionBox>
        ) : (
          <>

            {/* 공정 통계 카드 — 진척도/진행도 호버 툴팁 활성 */}
            {dashboard && (
              <StatsSection dashboard={dashboard} />
            )}

            {/* 오늘 할 일 */}
            <S.SectionBox>
              <S.SectionHead>
                <h3>오늘 할 일</h3>
                <span>{dashboard?.todayTasks?.length ?? 0}건</span>
              </S.SectionHead>
              <S.TaskList>
                {dashLoading ? (
                  <S.EmptyMsg>불러오는 중...</S.EmptyMsg>
                ) : dashboard?.todayTasks?.length > 0 ? (
                  dashboard.todayTasks.map((task) => (
                    <S.TaskItem key={task.minorProcessId}>
                      {/* 상단 한 줄 */}
                      <S.TaskRow>
                        <S.TaskStatusBtn
                          status={task.status}
                          onClick={() => doStatus(task.minorProcessId)}
                        >
                          {STATUS_LABEL[task.status] ?? task.status}
                        </S.TaskStatusBtn>
                        <S.TaskName>{task.minorProcessName}</S.TaskName>
                        <S.MajorLabel>{task.majorProcessName}</S.MajorLabel>
                        {/* 📝 일지 작성 — 해당 소공정 미리 선택해서 이동 */}
                        <S.TaskReportBtn
                          onClick={() => handleGoReport(task)}
                          title="일지에 추가"
                        >
                          📝
                        </S.TaskReportBtn>
                        {/* ✎ 메모 토글 — 메모 있으면 남색 강조 */}
                        <S.TaskMemoToggleBtn
                          active={!!task.memo || openMemoId === task.minorProcessId}
                          onClick={() => handleToggleMemo(task)}
                          title="메모"
                        >
                          ✎
                        </S.TaskMemoToggleBtn>
                        {/* ★ 클릭 시 오늘 할 일 해제 */}
                        <S.TaskTodayBtn
                          active={true}
                          onClick={() => doToday(task.minorProcessId)}
                          title="오늘 할 일 해제"
                        >
                          ★
                        </S.TaskTodayBtn>
                      </S.TaskRow>

                      {/* 메모 미리보기 — 접혀 있고 내용 있을 때 */}
                      {openMemoId !== task.minorProcessId && task.memo && (
                        <S.TaskMemoPreview>{task.memo}</S.TaskMemoPreview>
                      )}

                      {/* 메모 편집 영역 */}
                      {openMemoId === task.minorProcessId && (
                        <S.TaskMemoArea>
                          <S.TaskMemoTextarea
                            autoFocus
                            placeholder="메모를 입력하세요..."
                            value={memoDraft}
                            onChange={(e) => setMemoDraft(e.target.value)}
                          />
                          <S.TaskMemoSaveBtn
                            onClick={() => doMemo({ minorId: task.minorProcessId, memo: memoDraft })}
                          >
                            저장
                          </S.TaskMemoSaveBtn>
                        </S.TaskMemoArea>
                      )}
                    </S.TaskItem>
                  ))
                ) : (
                  <S.EmptyMsg>
                    오늘 예정된 작업이 없습니다.{'\n'}
                    체크리스트에서 ★을 눌러 추가하세요.
                  </S.EmptyMsg>
                )}
              </S.TaskList>
            </S.SectionBox>
          </>
        )}
      </S.Content>

      <BottomNav />
    </S.Page>
  );
}
