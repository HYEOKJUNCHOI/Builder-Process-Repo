import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Svg, { Circle } from 'react-native-svg';
import { fetchMyProjects, fetchDashboard } from './Dashboard.api';
import { setMinorStatus, toggleToday, updateMinorMemo } from '../Checklist/Checklist.api';
import { createReport, removeMinorFromTodayReport } from '../Report/Report.api';
import { useWeather } from '../../hooks/useWeather';

const STATUS_LABEL = { WAITING: '대기', IN_PROGRESS: '진행', TOUCH_UP: '마무리', DONE: '완료' };
const STATUS_COLOR = { WAITING: '#9E9E9E', IN_PROGRESS: '#1565C0', TOUCH_UP: '#F57C00', DONE: '#2E7D32' };
const NAVY = '#1A237E';
const DARK_NAVY = '#1E2D4E';
const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate() {
  const now = new Date();
  return `${now.getMonth() + 1}월 ${now.getDate()}일`;
}
function getDayName() {
  return DAY_KO[new Date().getDay()] + '요일';
}

/* ── SVG 원형 진행 링 ── */
function CircleProgress({ value = 0, color = NAVY, size = 58 }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, value)) / 100);
  const half = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={half} cy={half} r={r} fill="none" stroke="#E8EAF6" strokeWidth={sw} />
      <Circle
        cx={half} cy={half} r={r}
        fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90" origin={`${half}, ${half}`}
      />
    </Svg>
  );
}

/* ── 통계 링 카드 1개 ── */
function StatCard({ value, color, label, ringLabelColor }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statRingWrap}>
        <CircleProgress value={value} color={color} size={58} />
        <Text style={[styles.statRingLabel, ringLabelColor ? { color: ringLabelColor } : null]}>
          {value}%
        </Text>
      </View>
      <Text style={styles.statName}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const queryClient = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [openStatusMinorId, setOpenStatusMinorId] = useState(null);
  const [openMemoId, setOpenMemoId] = useState(null);
  const [memoDraft, setMemoDraft] = useState('');

  /* 현장 목록 */
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchMyProjects,
  });

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) setSelectedProjectId(projects[0].id);
  }, [projects]);

  /* 오늘 할 일 + 통계 */
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', selectedProjectId],
    queryFn: () => fetchDashboard(selectedProjectId),
    enabled: !!selectedProjectId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  /* 날씨 — 좌표 우선, 없으면 주소로 geocoding */
  const { weather, tomorrow } = useWeather({
    address: selectedProject?.address ?? null,
    lat: selectedProject?.lat ?? null,
    lng: selectedProject?.lng ?? null,
  });

  /* ── 통계 계산 ── */
  const today = new Date();
  const start = dashboard?.startDate ? new Date(dashboard.startDate) : null;
  const end = dashboard?.endDate ? new Date(dashboard.endDate) : null;

  let schedule = 0;
  if (start && end) {
    const totalDays = Math.max(1, Math.ceil((end - start) / 86400000));
    const elapsedDays = Math.max(0, Math.ceil((today - start) / 86400000));
    schedule = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  }

  const totalCount = dashboard?.totalMinorCount ?? 0;
  const doneCount = dashboard?.doneMinorCount ?? 0;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const deviation = Math.abs(schedule - progress);
  const isAhead = schedule - progress <= 0;

  /* 오늘 할 일 상태별 건수 */
  const todayTasks = dashboard?.todayTasks ?? [];
  const cntW  = todayTasks.filter(t => t.status === 'WAITING').length;
  const cntI  = todayTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const cntT  = todayTasks.filter(t => t.status === 'TOUCH_UP').length;
  const cntD  = todayTasks.filter(t => t.status === 'DONE').length;

  /* ── 캐시 무효화 ── */
  const invalidateBoth = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
    queryClient.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
  };

  const { mutate: doSetStatus } = useMutation({
    mutationFn: ({ minorId, nextStatus }) => setMinorStatus(selectedProjectId, minorId, nextStatus),
    onSuccess: invalidateBoth,
  });

  // 대시보드에 올라온 항목은 isToday=true 상태이므로 토글 = 해제(false로)
  const { mutate: doToday } = useMutation({
    mutationFn: (minorId) => toggleToday(selectedProjectId, minorId, true),
    onSuccess: invalidateBoth,
  });

  const { mutate: doMemo } = useMutation({
    mutationFn: ({ minorId, memo }) => updateMinorMemo(selectedProjectId, minorId, memo),
    onSuccess: () => { invalidateBoth(); setOpenMemoId(null); },
  });

  /* 📝/✅ 일지 담기·제거 */
  const handleToggleReport = async (task) => {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    if (task.isReported) {
      await removeMinorFromTodayReport(selectedProjectId, task.id);
    } else {
      await createReport(selectedProjectId, {
        reportDate: todayStr,
        weather: weather?.text ?? '',
        minorProcessIds: [task.id],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
    queryClient.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
    queryClient.invalidateQueries({ queryKey: ['todayReport', selectedProjectId] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateText}>{formatDate()}</Text>
          <Text style={styles.dayText}>{getDayName()}</Text>
        </View>
        <TouchableOpacity
          style={styles.projectBtn}
          onPress={() => setProjectPickerVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.projectBtnText} numberOfLines={1}>
            {selectedProject ? selectedProject.name : '현장 선택'}
          </Text>
          <Text style={styles.projectBtnArrow}>▾</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

        {/* 현장 없을 때 */}
        {projects.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              등록된 현장이 없습니다.{'\n'}공정관리 탭에서 현장을 먼저 만들어보세요.
            </Text>
          </View>
        )}

        {selectedProjectId && (
          <>
            {/* ── 날씨 카드 ── */}
            {(weather || tomorrow) && (
              <View style={styles.weatherRow}>
                {weather && (
                  <View style={styles.weatherCard}>
                    <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
                    <Text style={styles.weatherLabel}>현재</Text>
                    <Text style={styles.weatherValue}>{weather.temp}°C</Text>
                  </View>
                )}
                {weather?.rain !== undefined && (
                  <View style={styles.weatherCard}>
                    <Text style={styles.weatherEmoji}>💧</Text>
                    <Text style={styles.weatherLabel}>강수</Text>
                    <Text style={styles.weatherValue}>{weather.rain}%</Text>
                  </View>
                )}
                {tomorrow && (
                  <View style={styles.weatherCard}>
                    <Text style={styles.weatherEmoji}>{tomorrow.emoji}</Text>
                    <Text style={styles.weatherLabel}>내일</Text>
                    <Text style={styles.weatherValue}>{tomorrow.tempMax}°C</Text>
                  </View>
                )}
              </View>
            )}

            {/* ── 통계 3링 ── */}
            {dashboard && (
              <View style={styles.statsDarkCard}>
                <Text style={styles.statsDarkTitle}>현장 성과</Text>
                <View style={styles.statsGrid}>
                  <StatCard value={schedule} color={DARK_NAVY} label="진척도" />
                  <StatCard value={progress} color="#1565C0" label="진행도" />
                  <StatCard
                    value={deviation}
                    color={isAhead ? '#2E7D32' : '#C62828'}
                    label="공정편차"
                    ringLabelColor={isAhead ? '#2E7D32' : '#C62828'}
                  />
                </View>
              </View>
            )}

            {/* ── 오늘 할 일 ── */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>오늘 할 일</Text>
                {dashboard && (
                  <Text style={styles.taskCountTotal}>{todayTasks.length}건</Text>
                )}
              </View>

              {/* 상태별 건수 칩 */}
              {todayTasks.length > 0 && (
                <View style={styles.statusCountRow}>
                  {[['WAITING', cntW], ['IN_PROGRESS', cntI], ['TOUCH_UP', cntT], ['DONE', cntD]]
                    .filter(([, cnt]) => cnt > 0)
                    .map(([st, cnt]) => (
                      <View key={st} style={[styles.statusCountChip, { borderColor: STATUS_COLOR[st] }]}>
                        <Text style={[styles.statusCountText, { color: STATUS_COLOR[st] }]}>
                          {STATUS_LABEL[st]} {cnt}
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              {isLoading ? (
                <ActivityIndicator style={{ marginTop: 24 }} color={NAVY} />
              ) : todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <View style={styles.taskRow}>
                      {/* 상태 배지 */}
                      <TouchableOpacity
                        style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[task.status] }]}
                        onPress={() => setOpenStatusMinorId(
                          openStatusMinorId === task.id ? null : task.id,
                        )}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.statusBadgeText}>{STATUS_LABEL[task.status]}</Text>
                      </TouchableOpacity>

                      <View style={styles.taskNameWrap}>
                        <Text style={styles.taskName}>{task.minorProcessName}</Text>
                        <Text style={styles.majorLabel}>{task.majorProcessName}</Text>
                      </View>

                      {/* 📝/✅ 일지 담기·제거 */}
                      <TouchableOpacity
                        style={[styles.iconBtn, task.isReported && styles.iconBtnReported]}
                        onPress={() => handleToggleReport(task)}
                      >
                        <Text style={styles.iconBtnText}>{task.isReported ? '✅' : '📝'}</Text>
                      </TouchableOpacity>

                      {/* ✎ 메모 */}
                      <TouchableOpacity
                        style={[styles.iconBtn, openMemoId === task.id && styles.iconBtnActive]}
                        onPress={() => {
                          if (openMemoId === task.id) { setOpenMemoId(null); }
                          else { setOpenMemoId(task.id); setMemoDraft(task.memo ?? ''); }
                        }}
                      >
                        <Text style={styles.iconBtnText}>✎</Text>
                      </TouchableOpacity>

                      {/* ★ 오늘 할 일 해제 */}
                      <TouchableOpacity
                        style={[styles.iconBtn, styles.iconBtnStar]}
                        onPress={() => doToday(task.id)}
                      >
                        <Text style={styles.iconBtnText}>★</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 상태 변경 팝오버 */}
                    {openStatusMinorId === task.id && (
                      <View style={styles.statusPopover}>
                        {['WAITING', 'IN_PROGRESS', 'TOUCH_UP', 'DONE']
                          .filter(st => st !== task.status)
                          .map(st => (
                            <TouchableOpacity
                              key={st}
                              style={[styles.statusOption, { borderColor: STATUS_COLOR[st] }]}
                              onPress={() => { doSetStatus({ minorId: task.id, nextStatus: st }); setOpenStatusMinorId(null); }}
                            >
                              <Text style={[styles.statusOptionText, { color: STATUS_COLOR[st] }]}>
                                {STATUS_LABEL[st]}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}

                    {/* 메모 미리보기 */}
                    {openMemoId !== task.id && !!task.memo && (
                      <Text style={styles.memoPreview}>{task.memo}</Text>
                    )}

                    {/* 메모 편집 */}
                    {openMemoId === task.id && (
                      <View style={styles.memoArea}>
                        <TextInput
                          style={styles.memoInput}
                          value={memoDraft}
                          onChangeText={setMemoDraft}
                          placeholder="메모를 입력하세요..."
                          placeholderTextColor="#9E9E9E"
                          multiline
                          autoFocus
                        />
                        <View style={styles.memoBtns}>
                          <TouchableOpacity
                            style={styles.memoSaveBtn}
                            onPress={() => doMemo({ minorId: task.id, memo: memoDraft })}
                          >
                            <Text style={styles.memoSaveBtnText}>저장</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.memoCancelBtn}
                            onPress={() => setOpenMemoId(null)}
                          >
                            <Text style={styles.memoCancelBtnText}>취소</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  오늘 예정된 작업이 없습니다.{'\n'}체크리스트에서 ★을 눌러 추가하세요.
                </Text>
              )}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* 현장 선택 모달 */}
      <Modal
        visible={projectPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProjectPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProjectPickerVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>현장 선택</Text>
            {projects.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.modalItem, selectedProjectId === p.id && styles.modalItemActive]}
                onPress={() => { setSelectedProjectId(p.id); setProjectPickerVisible(false); }}
              >
                <Text style={[styles.modalItemText, selectedProjectId === p.id && styles.modalItemTextActive]}>
                  {p.name}{p.address ? `  /  ${p.address}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: '#F8F7F4' },
  header:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  dateBlock:  {},
  dateText:   { fontSize: 20, fontWeight: '800', color: NAVY },
  dayText:    { fontSize: 13, color: '#757575', marginTop: 2 },
  projectBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: NAVY, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, maxWidth: 200,
  },
  projectBtnText:  { color: '#fff', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  projectBtnArrow: { color: '#fff', fontSize: 12, marginLeft: 6 },

  content:    { flex: 1, padding: 16 },
  emptyBox:   { alignItems: 'center', paddingVertical: 40 },
  emptyText:  { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 22 },

  /* 날씨 */
  weatherRow:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  weatherCard:  {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  weatherEmoji: { fontSize: 22, marginBottom: 4 },
  weatherLabel: { fontSize: 11, color: '#9E9E9E', marginBottom: 2 },
  weatherValue: { fontSize: 14, fontWeight: '700', color: '#212121' },

  /* 통계 3링 */
  statsDarkCard: {
    backgroundColor: DARK_NAVY, borderRadius: 14, padding: 14, marginBottom: 12,
  },
  statsDarkTitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginBottom: 10 },
  statsGrid:  { flexDirection: 'row', gap: 8 },
  statCard:   {
    flex: 1, backgroundColor: '#fff', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', gap: 4,
  },
  statRingWrap:  { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  statRingLabel: { position: 'absolute', fontSize: 12, fontWeight: '700', color: NAVY },
  statName:   { fontSize: 11, fontWeight: '600', color: '#616161' },

  /* 오늘 할 일 */
  sectionBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    marginBottom: 12,
  },
  sectionHead:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle:     { fontSize: 16, fontWeight: '700', color: '#212121' },
  taskCountTotal:   { fontSize: 13, color: '#757575' },

  statusCountRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  statusCountChip:  { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusCountText:  { fontSize: 11, fontWeight: '600' },

  taskItem:         { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  taskRow:          { flexDirection: 'row', alignItems: 'center' },
  statusBadge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 10 },
  statusBadgeText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  taskNameWrap:     { flex: 1 },
  taskName:         { fontSize: 14, color: '#212121', fontWeight: '500' },
  majorLabel:       { fontSize: 11, color: '#9E9E9E', marginTop: 2 },

  iconBtn:          {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F5F5', marginLeft: 6,
  },
  iconBtnActive:    { backgroundColor: NAVY },
  iconBtnStar:      { backgroundColor: '#FFF9C4' },
  iconBtnReported:  { backgroundColor: '#E8F5E9' },
  iconBtnText:      { fontSize: 14 },

  statusPopover:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 4 },
  statusOption:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusOptionText: { fontSize: 12, fontWeight: '600' },

  memoPreview:      { fontSize: 12, color: '#757575', marginTop: 6, paddingLeft: 4 },
  memoArea:         { marginTop: 8 },
  memoInput:        {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 10, fontSize: 14, color: '#212121',
    minHeight: 72, textAlignVertical: 'top',
  },
  memoBtns:         { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
  memoSaveBtn:      { backgroundColor: NAVY, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 7 },
  memoSaveBtnText:  { color: '#fff', fontSize: 13, fontWeight: '600' },
  memoCancelBtn:    { backgroundColor: '#EEEEEE', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 7 },
  memoCancelBtnText:{ color: '#424242', fontSize: 13 },

  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalTitle:       { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 14 },
  modalItem:        { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  modalItemActive:  { backgroundColor: '#E8EAF6', borderRadius: 8, paddingHorizontal: 10 },
  modalItemText:    { fontSize: 15, color: '#424242' },
  modalItemTextActive: { color: NAVY, fontWeight: '700' },
});
