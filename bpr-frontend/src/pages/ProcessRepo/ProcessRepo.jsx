import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '../../components/layout/BottomNav';
import { fetchTemplates } from '../Dashboard/Dashboard.api';
import * as S from './ProcessRepo.style';

/**
 * 공정 레퍼런스 페이지
 * - 템플릿 목록 열람 (대공정/소공정 구조 펼침)
 * - "이 템플릿으로 현장 만들기" → 체크리스트 탭으로 이동하며 templateId 전달
 */
export default function ProcessRepo() {
  const navigate = useNavigate();
  const [openTemplates, setOpenTemplates] = useState({});

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  const toggleTemplate = (id) => {
    setOpenTemplates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 체크리스트로 이동하면서 templateId를 state로 전달
  const handleUseTemplate = (e, templateId) => {
    e.stopPropagation(); // 헤더 펼침/접기 이벤트와 충돌 방지
    navigate('/checklist', { state: { templateId } });
  };

  return (
    <S.Page>
      <S.Header>
        <S.HeaderTitle>공정 레퍼런스</S.HeaderTitle>
        <S.HeaderSub>
          템플릿을 선택해 현장 공정을 빠르게 시작하세요.
        </S.HeaderSub>
      </S.Header>

      <S.Content>
        {isLoading ? (
          <S.EmptyMsg>불러오는 중...</S.EmptyMsg>
        ) : templates.length === 0 ? (
          <S.EmptyMsg>등록된 템플릿이 없습니다.</S.EmptyMsg>
        ) : (
          templates.map((template) => {
            const isOpen = !!openTemplates[template.id];
            return (
              <S.TemplateCard key={template.id}>
                {/* 헤더 — 탭으로 펼침/접기 */}
                <S.TemplateHeader onClick={() => toggleTemplate(template.id)}>
                  <S.TemplateName>
                    {template.name}
                    {template.isDefault && ' (기본)'}
                  </S.TemplateName>
                  <S.TemplateChevron open={isOpen}>▼</S.TemplateChevron>
                </S.TemplateHeader>

                {/* "이 템플릿으로 현장 만들기" CTA */}
                <S.UseTemplateBtn onClick={(e) => handleUseTemplate(e, template.id)}>
                  이 템플릿으로 현장 만들기 →
                </S.UseTemplateBtn>

                {/* 대공정 / 소공정 구조 */}
                {isOpen &&
                  (template.majorProcesses ?? []).map((major, idx) => (
                    <S.MajorSection key={major.id}>
                      <S.MajorRow>
                        <S.MajorOrder>{idx + 1}</S.MajorOrder>
                        <S.MajorName>{major.name}</S.MajorName>
                      </S.MajorRow>
                      <S.MinorList>
                        {(major.minorProcesses ?? []).map((minor) => (
                          <S.MinorItem key={minor.id}>
                            {minor.name}
                          </S.MinorItem>
                        ))}
                      </S.MinorList>
                    </S.MajorSection>
                  ))}
              </S.TemplateCard>
            );
          })
        )}
      </S.Content>

      <BottomNav />
    </S.Page>
  );
}
