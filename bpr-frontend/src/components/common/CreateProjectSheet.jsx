import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTemplates, createProject } from '../../pages/Dashboard/Dashboard.api';
import * as S from '../../pages/Checklist/Checklist.style';

/**
 * 새 현장 생성 바텀시트 — 공통 컴포넌트
 * Checklist, ProcessRepo 등 여러 페이지에서 재사용
 *
 * @param {string|null}  preselectedTemplateId - 미리 선택될 템플릿 ID
 * @param {Function}     onClose               - 시트 닫기 콜백
 * @param {Function}     onCreated             - 생성 완료 콜백 ({ id, name, ... })
 */
export default function CreateProjectSheet({ preselectedTemplateId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [templateId, setTemplateId] = useState(
    preselectedTemplateId ? String(preselectedTemplateId) : ''
  );
  const [saving, setSaving] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  /* 현장명·착공일·준공예정일 모두 입력돼야 제출 가능 */
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
        /* templateId는 Firestore 문서 ID(문자열)이므로 Number 변환 없이 전달 */
        templateId: templateId || undefined,
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
                  {t.name} {t.isDefault ? '(예시)' : ''}
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
