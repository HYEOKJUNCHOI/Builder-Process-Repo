import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomNav from '../../components/layout/BottomNav';
import { fetchTemplates, deleteTemplate, uploadTemplateImage, seedJaDefaultTemplate } from '../Dashboard/Dashboard.api';
import CreateProjectSheet from '../../components/common/CreateProjectSheet';
import useT from '../../i18n/useT';
import * as S from './ProcessRepo.style';

/**
 * 공정 레퍼런스 페이지
 * - 예시 템플릿 1개(navy) + 사용자 템플릿(white) → 5열 통합 그리드
 * - 박스 클릭 → 현장 생성 시트 표시 → 완료 후 체크리스트로 이동
 */
export default function ProcessRepo() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t, lang } = useT();

  /* 현장 생성 시트 상태 */
  const [createSheet, setCreateSheet] = useState({ open: false, templateId: null });

  /* 무한 스크롤 — 한 번에 6개씩 표시 */
  const PAGE_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  /* sentinel이 화면에 보이면 visibleCount 증가 */
  const setSentinel = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + PAGE_SIZE);
      }
    }, { threshold: 0.1 });
    observerRef.current.observe(node);
    sentinelRef.current = node;
  }, []);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  /* 사용자 템플릿 삭제 */
  const deleteMutation = useMutation({
    mutationFn: (templateId) => deleteTemplate(templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (err) => {
      alert('삭제 실패: ' + err.message);
    },
  });

  /* 박스 클릭 → 현장 생성 시트 열기 */
  const handleUseTemplate = (templateId) => {
    setCreateSheet({ open: true, templateId });
  };

  /* 이름 키워드로 기본 건물 이모지 결정 */
  const getTemplateIcon = (name = '') => {
    if (name.includes('공장') || name.includes('OO')) return '🏭';
    if (name.includes('사무')) return '🏢';
    if (name.includes('창고')) return '🏗️';
    if (name.includes('주거') || name.includes('아파트')) return '🏠';
    return '🏗️';
  };

  /* 사용자 템플릿 썸네일 업로드
   * invalidateQueries 대신 setQueryData로 캐시를 직접 패치 —
   * Firestore가 캐시된 구버전을 반환하는 문제를 방지하기 위함 */
  const handleImageUpload = async (templateId, file) => {
    try {
      const downloadUrl = await uploadTemplateImage(templateId, file);
      qc.setQueryData(['templates'], (old) =>
        old?.map((t) => t.id === templateId ? { ...t, imageUrl: downloadUrl } : t)
      );
    } catch (err) {
      alert('사진 등록 실패: ' + err.message);
    }
  };

  /* 현장 생성 완료 → 캐시 갱신 후 체크리스트로 이동 */
  const handleProjectCreated = (newProject) => {
    qc.invalidateQueries({ queryKey: ['projects'] });
    setCreateSheet({ open: false, templateId: null });
    navigate('/checklist', { state: { selectedProjectId: newProject.id } });
  };

  /* 일본어 모드일 때 JA 예시 템플릿이 없으면 Firestore에 1회 시딩 */
  useEffect(() => {
    if (lang !== 'ja') return;
    const hasJaDefault = templates.some((t) => t.isDefault && t.lang === 'ja');
    if (!hasJaDefault && templates.length > 0) {
      // 로딩 완료 후에도 없으면 시딩 → 완료 후 캐시 갱신
      seedJaDefaultTemplate().then(() => {
        qc.invalidateQueries({ queryKey: ['templates'] });
      });
    }
  }, [lang, templates]);

  /* 예시 템플릿 1개만 표시, 표시 이름을 번역 파일에서 가져옴 */
  const defaultTemplate = templates.find((t) => t.isDefault && (t.lang === lang || (!t.lang && lang === 'ko'))) ?? null;
  /* createdAt 오름차순 — 오래된 순서대로, 신규는 맨 뒤 */
  const userTemplates = templates
    .filter((t) => !t.isDefault)
    .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));

  /* 그리드 순서: 예시(navy) 1개 → 사용자(white) N개 */
  const gridTemplates = [
    ...(defaultTemplate ? [{ ...defaultTemplate, displayName: t.defaultFactoryName }] : []),
    ...userTemplates.map((t) => ({ ...t, displayName: t.name })),
  ];

  return (
    <S.Page data-qa="process-repo-page">
      <S.Header data-qa="process-repo-header">
        <S.HeaderTitle>{t.processRepoTitle}</S.HeaderTitle>
        <S.HeaderSub>{t.processRepoSub}</S.HeaderSub>
      </S.Header>

      <S.Content>
        {isLoading ? (
          <S.EmptyMsg>{t.loading}</S.EmptyMsg>
        ) : gridTemplates.length === 0 ? (
          <S.EmptyMsg>{t.noTemplates}</S.EmptyMsg>
        ) : (
          /* 예시 + 사용자 템플릿 5열 통합 그리드 */
          <S.TemplateGrid data-qa="process-repo-template-grid">
            {gridTemplates.slice(0, visibleCount).map((template) => (
              /* 카드(100px) + 버튼(20px) 세로 묶음 */
              <S.TemplateGridItem key={template.id}>
                <S.TemplateBoxCard
                  $isDefault={!!template.isDefault}
                  onClick={() => handleUseTemplate(template.id)}
                >
                  {/* 이미지/아이콘 영역 */}
                  <S.TemplateBoxIconWrapper $isDefault={!!template.isDefault}>
                    {template.isDefault && (
                      <S.ExampleBadgeChip>{t.exampleTemplate}</S.ExampleBadgeChip>
                    )}
                    {template.imageUrl
                      ? <img src={template.imageUrl} alt={template.displayName} />
                      : getTemplateIcon(template.displayName)
                    }
                    {/* 사용자 템플릿만 삭제(✕) + 업로드 버튼 */}
                    {!template.isDefault && (
                      <S.TemplateBoxDeleteBtn
                        data-qa="thumb-delete-btn"
                        title="템플릿 삭제"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(t.deleteTemplateConfirm)) {
                            deleteMutation.mutate(template.id);
                          }
                        }}
                      >
                        ✕
                      </S.TemplateBoxDeleteBtn>
                    )}
                    {!template.isDefault && (
                      <S.TemplateBoxUploadBtn
                        data-qa="thumb-upload-btn"
                        title="사진 등록"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📷
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(template.id, file);
                          }}
                        />
                      </S.TemplateBoxUploadBtn>
                    )}
                  </S.TemplateBoxIconWrapper>

                  {/* 이름 영역 — 호버 시 "템플릿으로 사용하기"로 전환 */}
                  <S.TemplateBoxName>
                    <span className="name-text">{template.displayName}</span>
                    <span className="hover-text">{t.createFromTemplate} →</span>
                  </S.TemplateBoxName>
                </S.TemplateBoxCard>
              </S.TemplateGridItem>
            ))}
          </S.TemplateGrid>
        )}

        {/* 무한 스크롤 sentinel — 화면에 보이면 다음 페이지 로드 */}
        {visibleCount < gridTemplates.length && (
          <div ref={setSentinel} style={{ height: 24 }} />
        )}
      </S.Content>

      <BottomNav />

      {/* 현장 생성 시트 — 입력 완료 후 체크리스트로 이동 */}
      {createSheet.open && (
        <CreateProjectSheet
          preselectedTemplateId={createSheet.templateId}
          onClose={() => setCreateSheet({ open: false, templateId: null })}
          onCreated={handleProjectCreated}
        />
      )}
    </S.Page>
  );
}
