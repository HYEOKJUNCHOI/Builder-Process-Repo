import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LocationPickerModal from '../../components/common/LocationPickerModal';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTemplates, createProject, deleteTemplate,
  uploadTemplateThumbnail,
} from './ProcessRepo.api';
import { fetchMyProjects } from '../Dashboard/Dashboard.api';

const NAVY = '#1A237E';

export default function ProcessRepoScreen() {
  const qc = useQueryClient();
  const navigation = useNavigation();

  // '템플릿' 탭 vs '현장 목록' 탭
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'projects'

  // 현장 생성 모달
  const [createModal, setCreateModal] = useState({ visible: false, templateId: null, templateName: '' });
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [projectLat, setProjectLat] = useState(null);
  const [projectLng, setProjectLng] = useState(null);
  const [locPickerOpen, setLocPickerOpen] = useState(false);

  // 썸네일 업로드 진행 중인 templateId
  const [uploadingThumbId, setUploadingThumbId] = useState(null);

  /* ─── 데이터 쿼리 ─── */
  const { data: templates = [], isLoading: tLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
    staleTime: 0,
  });

  const { data: projects = [], isLoading: pLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchMyProjects,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  /* ─── Mutations ─── */
  const { mutate: doCreate, isPending: isCreating } = useMutation({
    mutationFn: () => createProject({
      name: projectName.trim(),
      address: projectAddress.trim(),
      lat: projectLat,
      lng: projectLng,
      templateId: createModal.templateId,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setCreateModal({ visible: false, templateId: null, templateName: '' });
      setProjectName('');
      setProjectAddress('');
      setProjectLat(null);
      setProjectLng(null);
      // 생성 완료 후 체크리스트 탭으로 이동 — 사용자가 바로 작업 시작하도록 유도
      Alert.alert(
        '현장 생성 완료',
        `'${projectName.trim()}' 현장이 생성되었습니다.\n체크리스트 탭으로 이동하시겠습니까?`,
        [
          { text: '여기 있기', style: 'cancel' },
          {
            text: '체크리스트로',
            onPress: () => navigation.navigate('체크리스트'),
          },
        ],
      );
    },
    onError: (e) => Alert.alert('오류', e.message),
  });

  const { mutate: doDeleteTemplate } = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  /* ─── 현장 생성 모달 열기 ─── */
  const openCreateModal = (templateId = null, templateName = '') => {
    setCreateModal({ visible: true, templateId, templateName });
    setProjectName('');
    setProjectAddress('');
    setProjectLat(null);
    setProjectLng(null);
  };

  /* ─── 썸네일 업로드 ─── */
  const handleUploadThumb = async (templateId) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploadingThumbId(templateId);
    try {
      // 600px로 압축 — 썸네일 용도이므로 작게
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      await uploadTemplateThumbnail(templateId, {
        uri: compressed.uri,
        mimeType: 'image/jpeg',
      });
      qc.invalidateQueries({ queryKey: ['templates'] });
    } catch (e) {
      Alert.alert('업로드 오류', e.message);
    } finally {
      setUploadingThumbId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>공정관리</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            공정 레퍼런스
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'projects' && styles.tabActive]}
          onPress={() => setActiveTab('projects')}
        >
          <Text style={[styles.tabText, activeTab === 'projects' && styles.tabTextActive]}>
            현장 목록
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 공정 레퍼런스 탭 ── */}
      {activeTab === 'templates' && (
        <ScrollView style={styles.content}>
          {tLoading && <ActivityIndicator style={{ marginTop: 40 }} color={NAVY} />}

          {!tLoading && templates.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                저장된 공정 레퍼런스가 없습니다.{'\n'}체크리스트에서 공정 구조를 저장해 보세요.
              </Text>
            </View>
          )}

          {/* 2열 그리드 */}
          <View style={styles.grid}>
            {templates.map(template => {
              const isUploading = uploadingThumbId === template.id;
              return (
                <View key={template.id} style={styles.templateCard}>
                  {/* 썸네일 영역 — 탭하면 이미지 선택 */}
                  <TouchableOpacity
                    style={styles.thumbArea}
                    onPress={() => handleUploadThumb(template.id)}
                    activeOpacity={0.7}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator color={NAVY} />
                    ) : template.thumbnailUrl ? (
                      <Image
                        source={{ uri: template.thumbnailUrl }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <Text style={styles.thumbEmoji}>📋</Text>
                        <Text style={styles.thumbHint}>탭해서 사진 추가</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* 카드 하단 */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName} numberOfLines={2}>{template.name}</Text>
                    <Text style={styles.cardDate}>
                      {template.createdAt ? template.createdAt.slice(0, 10) : ''}
                    </Text>

                    <View style={styles.cardBtns}>
                      {/* 이 템플릿으로 현장 생성 */}
                      <TouchableOpacity
                        style={styles.cardUseBtn}
                        onPress={() => openCreateModal(template.id, template.name)}
                      >
                        <Text style={styles.cardUseBtnText}>현장 생성</Text>
                      </TouchableOpacity>

                      {/* 삭제 */}
                      <TouchableOpacity
                        style={styles.cardDelBtn}
                        onPress={() => Alert.alert(
                          '레퍼런스 삭제',
                          `'${template.name}'을 삭제할까요?`,
                          [
                            { text: '취소', style: 'cancel' },
                            { text: '삭제', style: 'destructive', onPress: () => doDeleteTemplate(template.id) },
                          ],
                        )}
                      >
                        <Text style={styles.cardDelBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── 현장 목록 탭 ── */}
      {activeTab === 'projects' && (
        <ScrollView style={styles.content}>
          {/* 현장 직접 생성 버튼 */}
          <TouchableOpacity
            style={styles.newProjectBtn}
            onPress={() => openCreateModal(null, '')}
          >
            <Text style={styles.newProjectBtnText}>+ 새 현장 만들기</Text>
          </TouchableOpacity>

          {pLoading && <ActivityIndicator style={{ marginTop: 24 }} color={NAVY} />}

          {!pLoading && projects.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>등록된 현장이 없습니다.</Text>
            </View>
          )}

          {projects.map(p => (
            <View key={p.id} style={styles.projectRow}>
              <View style={styles.projectIcon}>
                <Text style={{ fontSize: 18 }}>🏗</Text>
              </View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{p.name}</Text>
                {p.address ? <Text style={styles.projectAddress}>{p.address}</Text> : null}
                {p.startDate ? (
                  <Text style={styles.projectDate}>
                    {p.startDate} ~ {p.endDate ?? '미정'}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* 현장 생성 모달 */}
      <Modal
        visible={createModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {createModal.templateId
                ? `'${createModal.templateName}' 기반 현장 생성`
                : '새 현장 만들기'}
            </Text>

            <Text style={styles.fieldLabel}>현장명 *</Text>
            <TextInput
              style={styles.inputField}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="현장 이름을 입력하세요"
              placeholderTextColor="#9E9E9E"
              autoFocus
            />

            <Text style={styles.fieldLabel}>주소</Text>
            {/* 텍스트 입력 + 📍 지도 선택 버튼 */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <TextInput
                style={[styles.inputField, { flex: 1, marginBottom: 0 }]}
                value={projectAddress}
                onChangeText={(t) => { setProjectAddress(t); setProjectLat(null); setProjectLng(null); }}
                placeholder="주소 검색 또는 직접 입력"
                placeholderTextColor="#9E9E9E"
              />
              <TouchableOpacity
                style={styles.mapPickerBtn}
                onPress={() => setLocPickerOpen(true)}
              >
                <Text style={styles.mapPickerBtnText}>📍</Text>
              </TouchableOpacity>
            </View>
            {/* 좌표가 선택된 경우 표시 */}
            {projectLat != null && projectLng != null && (
              <Text style={styles.coordHint}>
                {projectLat.toFixed(5)}, {projectLng.toFixed(5)}
              </Text>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreateModal(prev => ({ ...prev, visible: false }))}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!projectName.trim() || isCreating) && styles.modalConfirmDisabled]}
                onPress={() => projectName.trim() && doCreate()}
                disabled={!projectName.trim() || isCreating}
              >
                <Text style={styles.modalConfirmText}>
                  {isCreating ? '생성 중...' : '생성'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 현장 생성 — 지도 위치 선택 */}
      <LocationPickerModal
        visible={locPickerOpen}
        initialLat={projectLat}
        initialLng={projectLng}
        onConfirm={({ lat, lng, address }) => {
          setProjectLat(lat);
          setProjectLng(lng);
          // 역지오코딩 주소가 있고 아직 입력이 없으면 자동 채움
          if (address && !projectAddress.trim()) setProjectAddress(address);
          setLocPickerOpen(false);
        }}
        onClose={() => setLocPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: '#F8F7F4' },
  header:     {
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: NAVY },

  tabRow:     {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  tab:        { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive:  { borderBottomWidth: 2, borderBottomColor: NAVY },
  tabText:    { fontSize: 14, color: '#9E9E9E', fontWeight: '500' },
  tabTextActive: { color: NAVY, fontWeight: '700' },

  content:    { flex: 1, padding: 12 },
  emptyBox:   { alignItems: 'center', paddingVertical: 60 },
  emptyText:  { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 22 },

  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  templateCard: {
    width: '47.5%', backgroundColor: '#fff', borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    overflow: 'hidden', marginBottom: 4,
  },
  thumbArea:  {
    height: 90, backgroundColor: '#E8EAF6',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontSize: 32 },
  thumbHint:  { fontSize: 10, color: '#9E9E9E', marginTop: 4 },

  cardBody:   { padding: 10 },
  cardName:   { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 4 },
  cardDate:   { fontSize: 11, color: '#9E9E9E', marginBottom: 8 },
  cardBtns:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardUseBtn: { flex: 1, backgroundColor: NAVY, borderRadius: 6, paddingVertical: 6, alignItems: 'center' },
  cardUseBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardDelBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFEBEE',
    alignItems: 'center', justifyContent: 'center',
  },
  cardDelBtnText: { fontSize: 11, color: '#C62828' },

  newProjectBtn: {
    backgroundColor: NAVY, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 12,
  },
  newProjectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  projectRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  projectIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8EAF6',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  projectAddress: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  projectDate: { fontSize: 11, color: '#B0BEC5', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:   {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalTitle:   { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 20 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: '#616161', marginBottom: 6 },
  inputField:   {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 12, fontSize: 15, color: '#212121', marginBottom: 14,
  },
  modalBtns:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelBtn: { flex: 1, backgroundColor: '#EEEEEE', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  modalCancelText: { fontSize: 14, color: '#424242' },
  modalConfirmBtn: { flex: 1, backgroundColor: NAVY, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  modalConfirmDisabled: { backgroundColor: '#9E9E9E' },
  modalConfirmText: { fontSize: 14, color: '#fff', fontWeight: '700' },

  /* 지도 위치 선택 버튼 */
  mapPickerBtn: {
    width: 50, backgroundColor: '#E8EAF6', borderRadius: 8, borderWidth: 1,
    borderColor: '#C5CAE9', alignItems: 'center', justifyContent: 'center',
  },
  mapPickerBtnText: { fontSize: 22 },
  coordHint: { fontSize: 11, color: '#1A237E', marginBottom: 14, marginLeft: 2 },
});
