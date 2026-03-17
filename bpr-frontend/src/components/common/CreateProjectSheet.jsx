import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTemplates, createProject } from '../../pages/Dashboard/Dashboard.api';
import useT from '../../i18n/useT';
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
  const { t, lang } = useT();
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
      alert(t.editSiteEndError);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || undefined,
        startDate,
        endDate,
        templateId: templateId || undefined,
      };
      const newProject = await createProject(payload);
      onCreated(newProject);
    } catch (err) {
      alert(t.createSiteError + (err.response?.data || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <S.Overlay onClick={onClose}>
      <S.FormSheet onClick={(e) => e.stopPropagation()}>
        <S.FormSheetHeader>
          <S.FormSheetTitle>{t.createProjectTitle}</S.FormSheetTitle>
          <S.CloseBtn onClick={onClose}>✕</S.CloseBtn>
        </S.FormSheetHeader>

        <S.FormSheetBody>
          <S.FormGroup>
            <S.FormLabel>{t.editSiteName} <S.FormRequired>*</S.FormRequired></S.FormLabel>
            <S.FormInput
              placeholder={t.createSiteNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </S.FormGroup>

          <S.FormGroup>
            <S.FormLabel>{t.editSiteAddress}</S.FormLabel>
            <S.FormInput
              placeholder={t.createSiteAddressPlaceholder}
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

          <S.FormGroup>
            <S.FormLabel>{t.processTemplate}</S.FormLabel>
            <S.FormSelect
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">{t.selectNoTemplate}</option>
              {templates
                .filter((tmpl) => !tmpl.isDefault || tmpl.lang === lang || (!tmpl.lang && lang === 'ko'))
                .map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}{tmpl.isDefault ? ` (${t.exampleTemplate})` : ''}
                  </option>
                ))}
            </S.FormSelect>
          </S.FormGroup>

          <S.SubmitBtn onClick={handleSubmit} disabled={!isValid || saving}>
            {saving ? t.creating : t.createSiteSubmit}
          </S.SubmitBtn>
        </S.FormSheetBody>
      </S.FormSheet>
    </S.Overlay>
  );
}
