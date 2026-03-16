import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import LocationPickerModal from '../../components/common/LocationPickerModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyProjects, updateProject, deleteProject, saveProjectAsTemplate } from '../Dashboard/Dashboard.api';
import { createReport } from '../Report/Report.api';
import { useWeather } from '../../hooks/useWeather';
import {
  fetchChecklist, setMinorStatus, toggleToday, updateMinorMemo,
  addMajorProcess, addMinorProcess, deleteMajorProcess, deleteMinorProcess,
  reorderMinorProcess, reorderMajorProcess,
} from './Checklist.api';

const STATUS_LABEL = { WAITING: '대기', IN_PROGRESS: '진행', TOUCH_UP: '마무리', DONE: '완료' };
const STATUS_COLOR = { WAITING: '#9E9E9E', IN_PROGRESS: '#1565C0', TOUCH_UP: '#F57C00', DONE: '#2E7D32' };
const NAVY = '#1A237E';

export default function ChecklistScreen() {
  const qc = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectModalVisible, setProjectModalVisible] = useState(false);

  // 선택된 소공정/대공정 (▲▼ 순서변경용)
  const [selectedMinorId, setSelectedMinorId] = useState(null);
  const [selectedMajorId, setSelectedMajorId] = useState(null);

  // 상태 변경 팝오버
  const [openStatusId, setOpenStatusId] = useState(null);

  // 인라인 메모 편집
  const [openMemoId, setOpenMemoId] = useState(null);
  const [memoDraft, setMemoDraft] = useState('');

  // 아코디언
  const [openMajorIds, setOpenMajorIds] = useState(new Set());

  // 대공정/소공정 추가 모달
  const [addMajorModal, setAddMajorModal] = useState(false);
  const [addMinorModal, setAddMinorModal] = useState({ visible: false, majorId: null });
  const [inputName, setInputName] = useState('');

  // 현장 수정 모달
  const [editProjectModal, setEditProjectModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState(null);
  const [editLng, setEditLng] = useState(null);
  const [editLocPickerOpen, setEditLocPickerOpen] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // 현장 메뉴 (수정/삭제/레퍼런스 저장)
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);

  /* ─── 데이터 쿼리 ─── */
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: fetchMyProjects });

  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) setSelectedProjectId(projects[0].id);
  }, [projects]);

  const { data: checklist, isLoading } = useQuery({
    queryKey: ['checklist', selectedProjectId],
    queryFn: () => fetchChecklist(selectedProjectId),
    enabled: !!selectedProjectId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const majorProcesses = checklist?.majorProcesses ?? [];
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // 내일 날씨 — 좌표 우선, 없으면 주소로 geocoding
  const { tomorrow } = useWeather({
    address: selectedProject?.address ?? null,
    lat: selectedProject?.lat ?? null,
    lng: selectedProject?.lng ?? null,
  });

  /* ─── 캐시 무효화 ─── */
  const invalidate = () => qc.invalidateQueries({ queryKey: ['checklist', selectedProjectId] });
  const invalidateAll = () => {
    invalidate();
    qc.invalidateQueries({ queryKey: ['dashboard', selectedProjectId] });
    qc.invalidateQueries({ queryKey: ['todayReport', selectedProjectId] });
  };

  /* ─── Mutations ─── */
  const { mutate: doSetStatus } = useMutation({
    mutationFn: ({ minorId, status }) => setMinorStatus(selectedProjectId, minorId, status),
    onSuccess: invalidateAll,
  });

  const { mutate: doToggleToday } = useMutation({
    mutationFn: ({ minorId, isToday }) => toggleToday(selectedProjectId, minorId, isToday),
    onSuccess: invalidateAll,
  });

  const { mutate: doSaveMemo } = useMutation({
    mutationFn: ({ minorId, memo }) => updateMinorMemo(selectedProjectId, minorId, memo),
    onSuccess: () => { invalidate(); setOpenMemoId(null); },
  });

  const { mutate: doAddMajor } = useMutation({
    mutationFn: (name) => addMajorProcess(selectedProjectId, name),
    onSuccess: () => { invalidate(); setAddMajorModal(false); setInputName(''); },
  });

  const { mutate: doAddMinor } = useMutation({
    mutationFn: ({ majorId, name }) => addMinorProcess(selectedProjectId, majorId, name, ''),
    onSuccess: () => { invalidate(); setAddMinorModal({ visible: false, majorId: null }); setInputName(''); },
  });

  const { mutate: doDelMajor } = useMutation({
    mutationFn: (majorId) => deleteMajorProcess(selectedProjectId, majorId),
    onSuccess: invalidate,
  });

  const { mutate: doDelMinor } = useMutation({
    mutationFn: (minorId) => deleteMinorProcess(selectedProjectId, minorId),
    onSuccess: invalidate,
  });

  const { mutate: doUpdateProject } = useMutation({
    mutationFn: (payload) => updateProject(selectedProjectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setEditProjectModal(false);
    },
  });

  const { mutate: doDeleteProject } = useMutation({
    mutationFn: () => deleteProject(selectedProjectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      const remaining = projects.filter(p => p.id !== selectedProjectId);
      setSelectedProjectId(remaining.length > 0 ? remaining[0].id : null);
    },
  });

  /* ─── 일지 담기 ─── */
  const handleAddToReport = async (minor) => {
    const today = new Date().toLocaleDateString('sv-SE');
    await createReport(selectedProjectId, {
      reportDate: today,
      weather: '',
      minorProcessIds: [minor.id],
    });
    invalidateAll();
    Alert.alert('완료', `'${minor.name}'을 오늘 일지에 담았습니다.`);
  };

  /* ─── 공정 레퍼런스 저장 ─── */
  const handleSaveAsTemplate = () => {
    if (!selectedProject) return;
    Alert.prompt
      ? Alert.prompt('레퍼런스 저장', '템플릿 이름을 입력하세요:', [
          { text: '취소', style: 'cancel' },
          {
            text: '저장',
            onPress: async (name) => {
              if (!name?.trim()) return;
              await saveProjectAsTemplate(selectedProjectId, name.trim());
              qc.invalidateQueries({ queryKey: ['templates'] });
              Alert.alert('완료', '공정 레퍼런스에 저장되었습니다.');
            },
          },
        ], 'plain-text', selectedProject.name ?? '')
      : Alert.alert('레퍼런스 저장', `'${selectedProject.name}' 공정 구조를 레퍼런스로 저장합니다.`, [
          { text: '취소', style: 'cancel' },
          {
            text: '저장',
            onPress: async () => {
              await saveProjectAsTemplate(selectedProjectId, selectedProject.name ?? '레퍼런스');
              qc.invalidateQueries({ queryKey: ['templates'] });
              Alert.alert('완료', '공정 레퍼런스에 저장되었습니다.');
            },
          },
        ]);
  };

  /* ─── 순서 변경 ─── */
  const moveMinor = async (minor, dir, ownerMajor) => {
    const minors = ownerMajor.minorProcesses ?? [];
    const idx = minors.findIndex(m => m.id === minor.id);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= minors.length) return;
    const a = minors[idx], b = minors[targetIdx];
    let ca1 = a.createdAt, ca2 = b.createdAt;
    if (!ca1 || !ca2 || ca1 === ca2) {
      const now = Date.now();
      ca1 = dir < 0 ? new Date(now + 1).toISOString() : new Date(now).toISOString();
      ca2 = dir < 0 ? new Date(now).toISOString() : new Date(now + 1).toISOString();
    }
    await reorderMinorProcess(selectedProjectId, a.id, ca1, b.id, ca2);
    invalidate();
  };

  const moveMajor = async (major, dir) => {
    const idx = majorProcesses.findIndex(m => m.id === major.id);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= majorProcesses.length) return;
    const a = majorProcesses[idx], b = majorProcesses[targetIdx];
    let ca1 = a.createdAt, ca2 = b.createdAt;
    if (!ca1 || !ca2 || ca1 === ca2) {
      const now = Date.now();
      ca1 = dir < 0 ? new Date(now + 1).toISOString() : new Date(now).toISOString();
      ca2 = dir < 0 ? new Date(now).toISOString() : new Date(now + 1).toISOString();
    }
    await reorderMajorProcess(selectedProjectId, a.id, ca1, b.id, ca2);
    invalidate();
  };

  /* ─── 아코디언 ─── */
  const toggleMajorOpen = (majorId) => {
    setOpenMajorIds(prev => {
      const next = new Set(prev);
      next.has(majorId) ? next.delete(majorId) : next.add(majorId);
      return next;
    });
    setSelectedMajorId(prev => (prev === majorId ? null : majorId));
    setSelectedMinorId(null);
  };

  /* ─── Swipeable 우측 삭제 버튼 ─── */
  const renderRightActions = (onDelete) => (
    <TouchableOpacity style={styles.swipeDeleteBtn} onPress={onDelete}>
      <Text style={styles.swipeDeleteText}>삭제</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>체크리스트</Text>
          {/* 내일 날씨 */}
          {tomorrow && (
            <View style={styles.weatherChip}>
              <Text style={styles.weatherChipText}>
                내일 {tomorrow.emoji} {tomorrow.tempMax}°
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {/* 현장 메뉴 버튼 */}
          {selectedProjectId && (
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setProjectMenuVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuBtnText}>⋮</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.projectBtn}
            onPress={() => setProjectModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.projectBtnText} numberOfLines={1}>
              {selectedProject ? selectedProject.name : '현장 선택'}
            </Text>
            <Text style={styles.projectBtnArrow}>▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {projects.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>등록된 현장이 없습니다.{'\n'}공정관리 탭에서 현장을 먼저 만들어보세요.</Text>
          </View>
        )}

        {isLoading && <ActivityIndicator style={{ marginTop: 40 }} color={NAVY} />}

        {/* 대공정 목록 */}
        {!isLoading && majorProcesses.map((major) => {
          const isOpen = openMajorIds.has(major.id);
          const isMajorSel = selectedMajorId === major.id;
          return (
            <View key={major.id} style={styles.majorCard}>
              <Swipeable
                renderRightActions={() => renderRightActions(() =>
                  Alert.alert('대공정 삭제', `'${major.name}' 및 하위 소공정이 모두 삭제됩니다.`, [
                    { text: '취소', style: 'cancel' },
                    { text: '삭제', style: 'destructive', onPress: () => doDelMajor(major.id) },
                  ])
                )}
              >
                <TouchableOpacity
                  style={[styles.majorRow, isMajorSel && styles.majorRowSelected]}
                  onPress={() => toggleMajorOpen(major.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.majorArrow}>{isOpen ? '▼' : '▶'}</Text>
                  <Text style={styles.majorName} numberOfLines={1}>{major.name}</Text>
                  <Text style={styles.minorCount}>{major.minorProcesses.length}개</Text>

                  {/* 대공정 ▲▼ */}
                  {isMajorSel && (
                    <View style={styles.orderBtns}>
                      <TouchableOpacity style={styles.orderBtn} onPress={() => moveMajor(major, -1)}>
                        <Text style={styles.orderBtnText}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.orderBtn} onPress={() => moveMajor(major, 1)}>
                        <Text style={styles.orderBtnText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              </Swipeable>

              {/* 소공정 목록 */}
              {isOpen && (
                <View style={styles.minorList}>
                  {major.minorProcesses.map((minor) => {
                    const isMinorSel = selectedMinorId === minor.id;
                    const isMemoOpen = openMemoId === minor.id;
                    return (
                      <Swipeable
                        key={minor.id}
                        renderRightActions={() => renderRightActions(() =>
                          Alert.alert('소공정 삭제', `'${minor.name}'을 삭제할까요?`, [
                            { text: '취소', style: 'cancel' },
                            { text: '삭제', style: 'destructive', onPress: () => doDelMinor(minor.id) },
                          ])
                        )}
                      >
                        <TouchableOpacity
                          style={[styles.minorRow, isMinorSel && styles.minorRowSelected]}
                          onPress={() => {
                            setSelectedMinorId(prev => (prev === minor.id ? null : minor.id));
                            setSelectedMajorId(null);
                          }}
                          activeOpacity={0.85}
                        >
                          {/* 상태 배지 */}
                          <TouchableOpacity
                            style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[minor.status] }]}
                            onPress={() => setOpenStatusId(openStatusId === minor.id ? null : minor.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.statusBadgeText}>{STATUS_LABEL[minor.status]}</Text>
                          </TouchableOpacity>

                          <View style={styles.minorNameWrap}>
                            <Text style={styles.minorName} numberOfLines={1}>{minor.name}</Text>
                            {minor.memo && !isMemoOpen && (
                              <Text style={styles.minorMemoPreview} numberOfLines={1}>{minor.memo}</Text>
                            )}
                          </View>

                          {/* 📝 일지 담기 */}
                          <TouchableOpacity
                            style={[styles.iconBtn, minor.isReported && styles.iconBtnReported]}
                            onPress={() => minor.isReported
                              ? Alert.alert('안내', '이미 오늘 일지에 담겨 있습니다.')
                              : handleAddToReport(minor)
                            }
                          >
                            <Text style={styles.iconBtnText}>{minor.isReported ? '✅' : '📝'}</Text>
                          </TouchableOpacity>

                          {/* ✎ 메모 */}
                          <TouchableOpacity
                            style={[styles.iconBtn, isMemoOpen && styles.iconBtnActive]}
                            onPress={() => {
                              if (isMemoOpen) { setOpenMemoId(null); }
                              else { setOpenMemoId(minor.id); setMemoDraft(minor.memo ?? ''); }
                            }}
                          >
                            <Text style={styles.iconBtnText}>✎</Text>
                          </TouchableOpacity>

                          {/* ★ 오늘 할 일 */}
                          <TouchableOpacity
                            style={[styles.iconBtn, minor.isToday && styles.iconBtnStar]}
                            onPress={() => doToggleToday({ minorId: minor.id, isToday: minor.isToday })}
                          >
                            <Text style={[styles.iconBtnText, minor.isToday && { color: '#F9A825' }]}>★</Text>
                          </TouchableOpacity>

                          {/* ▲▼ 순서 */}
                          {isMinorSel && (
                            <View style={styles.orderBtns}>
                              <TouchableOpacity style={styles.orderBtn} onPress={() => moveMinor(minor, -1, major)}>
                                <Text style={styles.orderBtnText}>▲</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.orderBtn} onPress={() => moveMinor(minor, 1, major)}>
                                <Text style={styles.orderBtnText}>▼</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </TouchableOpacity>

                        {/* 상태 변경 팝오버 */}
                        {openStatusId === minor.id && (
                          <View style={styles.statusPopover}>
                            {['WAITING', 'IN_PROGRESS', 'TOUCH_UP', 'DONE']
                              .filter(st => st !== minor.status)
                              .map(st => (
                                <TouchableOpacity
                                  key={st}
                                  style={[styles.statusOption, { borderColor: STATUS_COLOR[st] }]}
                                  onPress={() => { doSetStatus({ minorId: minor.id, status: st }); setOpenStatusId(null); }}
                                >
                                  <Text style={[styles.statusOptionText, { color: STATUS_COLOR[st] }]}>
                                    {STATUS_LABEL[st]}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                          </View>
                        )}

                        {/* 메모 인라인 편집 */}
                        {isMemoOpen && (
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
                                onPress={() => doSaveMemo({ minorId: minor.id, memo: memoDraft })}
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
                      </Swipeable>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.addMinorBtn}
                    onPress={() => { setAddMinorModal({ visible: true, majorId: major.id }); setInputName(''); }}
                  >
                    <Text style={styles.addMinorBtnText}>+ 소공정 추가</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* FAB를 위한 하단 여백 */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── 현장 선택 모달 ── */}
      <Modal visible={projectModalVisible} transparent animationType="slide"
        onRequestClose={() => setProjectModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
          onPress={() => setProjectModalVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>현장 선택</Text>
            {projects.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.modalItem, selectedProjectId === p.id && styles.modalItemActive]}
                onPress={() => { setSelectedProjectId(p.id); setProjectModalVisible(false); setSelectedMinorId(null); setSelectedMajorId(null); }}
              >
                <Text style={[styles.modalItemText, selectedProjectId === p.id && styles.modalItemTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── 현장 메뉴 모달 (수정/삭제/레퍼런스) ── */}
      <Modal visible={projectMenuVisible} transparent animationType="fade"
        onRequestClose={() => setProjectMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
          onPress={() => setProjectMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setProjectMenuVisible(false);
              setEditName(selectedProject?.name ?? '');
              setEditAddress(selectedProject?.address ?? '');
              setEditLat(selectedProject?.lat ?? null);
              setEditLng(selectedProject?.lng ?? null);
              setEditStartDate(selectedProject?.startDate ?? '');
              setEditEndDate(selectedProject?.endDate ?? '');
              setEditProjectModal(true);
            }}>
              <Text style={styles.menuItemText}>✏️  현장 수정</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setProjectMenuVisible(false);
              handleSaveAsTemplate();
            }}>
              <Text style={styles.menuItemText}>📋  공정 레퍼런스로 저장</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={() => {
              setProjectMenuVisible(false);
              Alert.alert('현장 삭제', `'${selectedProject?.name}' 현장을 삭제할까요?\n\n모든 공정 데이터가 삭제됩니다.`, [
                { text: '취소', style: 'cancel' },
                { text: '삭제', style: 'destructive', onPress: () => doDeleteProject() },
              ]);
            }}>
              <Text style={[styles.menuItemText, { color: '#C62828' }]}>🗑  현장 삭제</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── 현장 수정 모달 ── */}
      <Modal visible={editProjectModal} transparent animationType="slide"
        onRequestClose={() => setEditProjectModal(false)}>
        <View style={styles.inputModalOverlay}>
          <View style={styles.inputModalBox}>
            <Text style={styles.inputModalTitle}>현장 수정</Text>
            <TextInput style={styles.inputField} value={editName} onChangeText={setEditName}
              placeholder="현장명" placeholderTextColor="#9E9E9E" />
            {/* 주소 입력 + 지도 선택 버튼 */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <TextInput
                style={[styles.inputField, { flex: 1, marginBottom: 0 }]}
                value={editAddress}
                onChangeText={(t) => { setEditAddress(t); setEditLat(null); setEditLng(null); }}
                placeholder="주소 (선택)"
                placeholderTextColor="#9E9E9E"
              />
              <TouchableOpacity
                style={styles.mapPickerBtn}
                onPress={() => setEditLocPickerOpen(true)}
              >
                <Text style={styles.mapPickerBtnText}>📍</Text>
              </TouchableOpacity>
            </View>
            {/* 좌표가 선택된 경우 표시 */}
            {editLat != null && editLng != null && (
              <Text style={styles.coordHint}>
                {editLat.toFixed(5)}, {editLng.toFixed(5)}
              </Text>
            )}
            <TextInput style={styles.inputField} value={editStartDate} onChangeText={setEditStartDate}
              placeholder="착공일 (YYYY-MM-DD)" placeholderTextColor="#9E9E9E" />
            <TextInput style={styles.inputField} value={editEndDate} onChangeText={setEditEndDate}
              placeholder="준공예정일 (YYYY-MM-DD)" placeholderTextColor="#9E9E9E" />
            <View style={styles.inputModalBtns}>
              <TouchableOpacity style={styles.inputCancelBtn} onPress={() => setEditProjectModal(false)}>
                <Text style={styles.inputCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inputConfirmBtn}
                onPress={() => editName.trim() && doUpdateProject({
                  name: editName.trim(),
                  address: editAddress.trim() || null,
                  lat: editLat ?? null,
                  lng: editLng ?? null,
                  startDate: editStartDate.trim() || null,
                  endDate: editEndDate.trim() || null,
                })}
              >
                <Text style={styles.inputConfirmText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 대공정 추가 모달 ── */}
      <Modal visible={addMajorModal} transparent animationType="fade"
        onRequestClose={() => setAddMajorModal(false)}>
        <View style={styles.inputModalOverlay}>
          <View style={styles.inputModalBox}>
            <Text style={styles.inputModalTitle}>대공정 추가</Text>
            <TextInput style={styles.inputField} value={inputName} onChangeText={setInputName}
              placeholder="대공정 이름" placeholderTextColor="#9E9E9E" autoFocus />
            <View style={styles.inputModalBtns}>
              <TouchableOpacity style={styles.inputCancelBtn} onPress={() => setAddMajorModal(false)}>
                <Text style={styles.inputCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputConfirmBtn}
                onPress={() => inputName.trim() && doAddMajor(inputName.trim())}>
                <Text style={styles.inputConfirmText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── FAB — 대공정 추가 (항시 우측 하단에 떠있음) ── */}
      {selectedProjectId && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { setAddMajorModal(true); setInputName(''); }}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* ── 소공정 추가 모달 ── */}
      <Modal visible={addMinorModal.visible} transparent animationType="fade"
        onRequestClose={() => setAddMinorModal({ visible: false, majorId: null })}>
        <View style={styles.inputModalOverlay}>
          <View style={styles.inputModalBox}>
            <Text style={styles.inputModalTitle}>소공정 추가</Text>
            <TextInput style={styles.inputField} value={inputName} onChangeText={setInputName}
              placeholder="소공정 이름" placeholderTextColor="#9E9E9E" autoFocus />
            <View style={styles.inputModalBtns}>
              <TouchableOpacity style={styles.inputCancelBtn}
                onPress={() => setAddMinorModal({ visible: false, majorId: null })}>
                <Text style={styles.inputCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputConfirmBtn}
                onPress={() => inputName.trim() && doAddMinor({ majorId: addMinorModal.majorId, name: inputName.trim() })}>
                <Text style={styles.inputConfirmText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 현장 수정 — 지도 위치 선택 */}
      <LocationPickerModal
        visible={editLocPickerOpen}
        initialLat={editLat}
        initialLng={editLng}
        onConfirm={({ lat, lng, address }) => {
          setEditLat(lat);
          setEditLng(lng);
          // 역지오코딩 주소가 있으면 주소 필드도 자동 채움 (빈 경우에만)
          if (address && !editAddress.trim()) setEditAddress(address);
          setEditLocPickerOpen(false);
        }}
        onClose={() => setEditLocPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: '#F8F7F4' },

  /* 헤더 */
  header:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: NAVY },
  weatherChip: {
    backgroundColor: '#E3F2FD', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  weatherChipText: { fontSize: 12, color: '#1565C0', fontWeight: '600' },
  menuBtn:     {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  menuBtnText: { fontSize: 18, color: '#424242', lineHeight: 22 },
  projectBtn:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: NAVY, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7, maxWidth: 160,
  },
  projectBtnText:  { color: '#fff', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  projectBtnArrow: { color: '#fff', fontSize: 11, marginLeft: 4 },

  content:     { flex: 1, padding: 12 },
  emptyBox:    { alignItems: 'center', paddingVertical: 60 },
  emptyText:   { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 22 },

  /* 대공정 카드 */
  majorCard:   {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    overflow: 'hidden',
  },
  majorRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  majorRowSelected: { backgroundColor: '#E8EAF6' },
  majorArrow:  { fontSize: 11, color: '#9E9E9E', marginRight: 8, width: 12 },
  majorName:   { flex: 1, fontSize: 15, fontWeight: '700', color: '#212121' },
  minorCount:  { fontSize: 12, color: '#9E9E9E', marginRight: 6 },

  /* 소공정 */
  minorList:   { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  minorRow:    {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  minorRowSelected: { backgroundColor: '#FFFDE7' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  minorNameWrap: { flex: 1, minWidth: 0 },
  minorName:   { fontSize: 14, color: '#212121' },
  minorMemoPreview: { fontSize: 11, color: '#9E9E9E', marginTop: 1 },

  iconBtn:     {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F5F5', marginLeft: 4,
  },
  iconBtnActive:   { backgroundColor: NAVY },
  iconBtnStar:     { backgroundColor: '#FFF9C4' },
  iconBtnReported: { backgroundColor: '#E8F5E9' },
  iconBtnText:     { fontSize: 13 },

  orderBtns:   { flexDirection: 'row', marginLeft: 4 },
  orderBtn:    {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8EAF6', marginLeft: 3,
  },
  orderBtnText: { fontSize: 10, color: NAVY, fontWeight: '700' },

  /* 상태 팝오버 */
  statusPopover: {
    width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FAFAFA',
  },
  statusOption:  { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusOptionText: { fontSize: 12, fontWeight: '600' },

  /* 메모 편집 */
  memoArea:    { paddingHorizontal: 14, paddingBottom: 10, backgroundColor: '#FAFAFA' },
  memoInput:   {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 10, fontSize: 14, color: '#212121',
    minHeight: 68, textAlignVertical: 'top', marginBottom: 8,
  },
  memoBtns:    { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  memoSaveBtn: { backgroundColor: NAVY, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  memoSaveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  memoCancelBtn:   { backgroundColor: '#EEEEEE', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  memoCancelBtnText: { color: '#424242', fontSize: 13 },

  /* 스와이프 삭제 */
  swipeDeleteBtn: {
    backgroundColor: '#C62828', justifyContent: 'center', alignItems: 'center',
    width: 72, borderRadius: 0,
  },
  swipeDeleteText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  /* 추가 버튼 */
  addMinorBtn:  { paddingVertical: 10, paddingHorizontal: 14 },
  addMinorBtnText: { fontSize: 13, color: NAVY, fontWeight: '600' },
  /* FAB — 대공정 추가 플로팅 버튼 */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    // 다른 요소 위에 떠있도록
    zIndex: 100,
    elevation: 8,          // Android 그림자
    shadowColor: '#000',   // iOS 그림자
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32, marginTop: -2 },

  /* 모달 공통 */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalTitle:   { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 14 },
  modalItem:    { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  modalItemActive: { backgroundColor: '#E8EAF6', borderRadius: 8, paddingHorizontal: 10 },
  modalItemText:   { fontSize: 15, color: '#424242' },
  modalItemTextActive: { color: NAVY, fontWeight: '700' },

  /* 현장 메뉴 */
  menuSheet:   {
    backgroundColor: '#fff', borderRadius: 16, margin: 20,
    overflow: 'hidden', marginBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  menuItem:    { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuItemDanger: { borderBottomWidth: 0 },
  menuItemText: { fontSize: 15, color: '#212121' },

  /* 입력 모달 */
  inputModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  inputModalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' },
  inputModalTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 16 },
  inputField:  {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 12, fontSize: 15, color: '#212121', marginBottom: 10,
  },
  inputModalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  inputCancelBtn: { paddingHorizontal: 18, paddingVertical: 9, backgroundColor: '#EEEEEE', borderRadius: 8 },
  inputCancelText: { fontSize: 14, color: '#424242' },
  inputConfirmBtn: { paddingHorizontal: 18, paddingVertical: 9, backgroundColor: NAVY, borderRadius: 8 },
  inputConfirmText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  /* 지도 위치 선택 버튼 */
  mapPickerBtn: {
    width: 46, backgroundColor: '#E8EAF6', borderRadius: 8, borderWidth: 1,
    borderColor: '#C5CAE9', alignItems: 'center', justifyContent: 'center',
  },
  mapPickerBtnText: { fontSize: 20 },
  coordHint: { fontSize: 11, color: '#1A237E', marginBottom: 10, marginLeft: 2 },
});
