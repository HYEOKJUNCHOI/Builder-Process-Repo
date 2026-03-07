import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomNav from '../../components/layout/BottomNav';
import { fetchMyProjects, fetchDashboard } from './Dashboard.api';
import { cycleStatus, toggleToday, updateMinorMemo } from '../Checklist/Checklist.api';
import { createReport, removeMinorFromTodayReport } from '../Report/Report.api';
import { useWeather } from '../../hooks/useWeather';
import StatsSection from '../../components/common/StatsSection';
import * as S from './Dashboard.style';

const STATUS_LABEL = {
  WAITING: '대기',
  IN_PROGRESS: '진행',
  TOUCH_UP: '마무리',
  DONE: '완료',
};

const DAY_FULL_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/** useWeather 텍스트를 일지 날씨 옵션으로 매핑 */
function mapWeatherText(text) {
  if (!text) return '맑음';
  if (text.includes('비') || text.includes('소나기')) return '비';
  if (text.includes('눈')) return '눈';
  if (text.includes('흐림') || text.includes('구름')) return '흐림';
  if (text.includes('바람') || text.includes('강풍')) return '강풍';
  return '맑음';
}

/** 날짜 문자열 — "3월 2일" 형식 (다크 박스 안 대형 표시용) */
function formatDate() {
  const now = new Date();
  return `${now.getMonth() + 1}월 ${now.getDate()}일`;
}

/** 요일 정보 — 이름 + 주말 여부 */
function getDayInfo() {
  const day = new Date().getDay();
  return { name: DAY_FULL_KO[day], isWeekend: day === 0 || day === 6 };
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
  const { weather, tomorrow } = useWeather(selectedProject?.address ?? null);

  /* 대시보드 + 체크리스트 캐시 동시 갱신 — 양쪽 화면이 항상 동기화됨 */
  const invalidateBoth = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
    queryClient.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
  };

  /* 소공정 상태 순환 (WAITING → IN_PROGRESS → TOUCH_UP → DONE → ...) */
  const { mutate: doStatus } = useMutation({
    mutationFn: ({ minorId, currentStatus }) => cycleStatus(selectedProjectId, minorId, currentStatus),
    onSuccess: invalidateBoth,
  });

  /* 오늘 할 일 토글 — 해제하면 대시보드 목록에서 제거됨 */
  const { mutate: doToday } = useMutation({
    mutationFn: (minorId) => toggleToday(selectedProjectId, minorId, true), // dashboard에 떠있는건 이미 isToday=true
    onSuccess: invalidateBoth,
  });

  /* 메모 저장 */
  const { mutate: doMemo } = useMutation({
    mutationFn: ({ minorId, memo }) => updateMinorMemo(selectedProjectId, minorId, memo),
    onSuccess: () => {
      invalidateBoth();
      setOpenMemoId(null);
    },
  });

  const handleToggleMemo = (task) => {
    // task.id를 기준으로 통일 — 렌더링 조건(openMemoId === task.id)과 일치시킴
    if (openMemoId === task.id) {
      setOpenMemoId(null);
    } else {
      setOpenMemoId(task.id);
      setMemoDraft(task.memo ?? '');
    }
  };

  /** 📝 버튼 — 오늘 날짜 + 현재 날씨로 해당 소공정을 일지에 즉시 저장 */
  const handleGoReport = async (task) => {
    const today = new Date().toISOString().slice(0, 10);
    const weatherOption = mapWeatherText(weather?.text);
    try {
      await createReport(selectedProjectId, {
        reportDate: today,
        weather: weatherOption,
        minorProcessIds: [task.id],  // task.id = Firestore doc.id = 소공정 실제 ID
      });
      // 일지 페이지의 오늘 보고서 캐시도 갱신 — staleTime(30초) 내 이동 시 반영
      queryClient.invalidateQueries({ queryKey: ['reports', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['report-today', selectedProjectId] });
      // 대시보드의 'isReported' 최신화를 위해 갱신
      queryClient.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
      alert('일지에 내용이 추가되었습니다.');
    } catch (err) {
      alert('일지 저장 실패: ' + (err.response?.data || err.message));
    }
  };

  /** ✅ 버튼 — 오늘 일지에서 해당 소공정을 제거 */
  const handleRemoveFromReport = async (minorId) => {
    try {
      await removeMinorFromTodayReport(selectedProjectId, minorId);
      // 대시보드 및 일지 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['reports', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['report-today', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
    } catch (err) {
      alert('일지 제거 실패: ' + err.message);
    }
  };

  return (
    <S.Page>
      {/* 헤더 — 현장 선택 드롭다운 */}
      <S.Header data-qa="dashboard-header">

        {/* 현장 선택 드롭다운 */}
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

            {/* 날짜·요일(flex:3) + 날씨 3카드 묶음(flex:7) — 10비율 가로 한 줄 */}
            <S.WeatherRow data-qa="dashboard-date-weather">
              <S.DateBlock>
                <S.DateBlockDate>{formatDate()}</S.DateBlockDate>
                <S.DateBlockDay>{getDayInfo().name}</S.DateBlockDay>
              </S.DateBlock>
              <S.WeatherGroup>
                {weather && (
                  <S.WeatherCard>
                    <S.WeatherIcon>{weather.emoji}</S.WeatherIcon>
                    <S.WeatherLabel>현재</S.WeatherLabel>
                    <S.WeatherValue>{weather.temp}°C</S.WeatherValue>
                  </S.WeatherCard>
                )}
                {weather?.rain !== undefined && (
                  <S.WeatherCard>
                    <S.WeatherIcon>💧</S.WeatherIcon>
                    <S.WeatherLabel>강수</S.WeatherLabel>
                    <S.WeatherValue>{weather.rain}%</S.WeatherValue>
                  </S.WeatherCard>
                )}
                {tomorrow && (
                  <S.WeatherCard>
                    <S.WeatherIcon>{tomorrow.emoji}</S.WeatherIcon>
                    <S.WeatherLabel>내일</S.WeatherLabel>
                    <S.WeatherValue>{tomorrow.tempMax}°C</S.WeatherValue>
                  </S.WeatherCard>
                )}
              </S.WeatherGroup>
            </S.WeatherRow>

            {/* 3링 통계 — StatsSection 자체 다크박스("현장 성과" 타이틀 포함) */}
            {dashboard && <StatsSection dashboard={dashboard} />}

            {/* 오늘 할 일 — 상태별 건수 계산 */}
            {(() => {
              const todayTasks = dashboard?.todayTasks ?? [];
              const totalCount = todayTasks.length;
              const waitingCount = todayTasks.filter(t => t.status === 'WAITING').length;
              const inProgressCount = todayTasks.filter(t => t.status === 'IN_PROGRESS').length;
              const touchUpCount = todayTasks.filter(t => t.status === 'TOUCH_UP').length;
              const doneCount = todayTasks.filter(t => t.status === 'DONE').length;
              return (
                <S.SectionBox>
                  <S.SectionHead>
                    <h3>오늘 할 일</h3>
                    <S.TaskCounts data-qa="dashboard-task-counts">
                      <S.TaskCountItem>전체 {totalCount}건</S.TaskCountItem>
                      <S.TaskCountItem>대기 {waitingCount}</S.TaskCountItem>
                      <S.TaskCountItem>진행 {inProgressCount}</S.TaskCountItem>
                      <S.TaskCountItem>마무리 {touchUpCount}</S.TaskCountItem>
                      <S.TaskCountItem>완료 {doneCount}</S.TaskCountItem>
                    </S.TaskCounts>
                  </S.SectionHead>
                  <S.TaskList>
                    {dashLoading ? (
                      <S.EmptyMsg>불러오는 중...</S.EmptyMsg>
                    ) : dashboard?.todayTasks?.length > 0 ? (
                      dashboard.todayTasks.map((task) => (
                        <S.TaskItem key={task.id}>
                          {/* 상단 한 줄 */}
                          <S.TaskRow>
                            <S.TaskStatusBtn
                              status={task.status}
                              onClick={() => doStatus({ minorId: task.id, currentStatus: task.status })}
                            >
                              {STATUS_LABEL[task.status] ?? task.status}
                            </S.TaskStatusBtn>
                            <S.TaskName>{task.minorProcessName}</S.TaskName>
                            <S.MajorLabel>{task.majorProcessName}</S.MajorLabel>
                            {/* 📝 일지 작성 / ✅ 일지에 추가됨 토글 */}
                            <S.TaskReportBtn
                              reported={task.isReported}
                              onClick={() => {
                                if (task.isReported) {
                                  handleRemoveFromReport(task.id);
                                } else {
                                  handleGoReport(task);
                                }
                              }}
                              title={task.isReported ? '일지에서 제거' : '일지에 추가'}
                            >
                              {task.isReported ? '✅' : '📝'}
                            </S.TaskReportBtn>
                            {/* ✎ 메모 토글 — 메모 있으면 남색 강조 */}
                            <S.TaskMemoToggleBtn
                              active={!!task.memo || openMemoId === task.id}
                              onClick={() => handleToggleMemo(task)}
                              title="메모"
                            >
                              ✎
                            </S.TaskMemoToggleBtn>
                            {/* ★ 클릭 시 오늘 할 일 해제 */}
                            <S.TaskTodayBtn
                              active={true}
                              onClick={() => doToday(task.id)}
                              title="오늘 할 일 해제"
                            >
                              ★
                            </S.TaskTodayBtn>
                          </S.TaskRow>

                          {/* 메모 미리보기 — 접혀 있고 내용 있을 때 */}
                          {openMemoId !== task.id && task.memo && (
                            <S.TaskMemoPreview>{task.memo}</S.TaskMemoPreview>
                          )}

                          {/* 메모 편집 영역 */}
                          {openMemoId === task.id && (
                            <S.TaskMemoArea>
                              <S.TaskMemoTextarea
                                autoFocus
                                placeholder="메모를 입력하세요..."
                                value={memoDraft}
                                onChange={(e) => setMemoDraft(e.target.value)}
                              />
                              <S.TaskMemoBtnCol>
                                <S.TaskMemoSaveBtn
                                  onClick={() => doMemo({ minorId: task.id, memo: memoDraft })}
                                >
                                  저장
                                </S.TaskMemoSaveBtn>
                                <S.TaskMemoCancelBtn onClick={() => setOpenMemoId(null)}>
                                  취소
                                </S.TaskMemoCancelBtn>
                              </S.TaskMemoBtnCol>
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
              );
            })()}
          </>
        )}
      </S.Content>

      <BottomNav />
    </S.Page>
  );
}
