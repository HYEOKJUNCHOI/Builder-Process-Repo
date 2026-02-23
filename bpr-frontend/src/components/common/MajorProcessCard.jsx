import React from 'react';
import { getProcessTheme } from '../../utils/processImageMap';
import * as S from './MajorProcessCard.style';

/**
 * 레시피 카드 스타일 대공정 카드
 * - 상단: 공정명 기반 그라디언트 + SVG 아이콘 일러스트
 * - 하단: 공정명, 소공정 수, 진행 현황
 * - 탭 → 소공정 바텀시트 열기
 */
export default function MajorProcessCard({ major, onClick, onDelete }) {
  const theme = getProcessTheme(major.name);
  const minors = major.minorProcesses ?? [];
  const total = minors.length;

  // 진행률 계산 (DONE 상태 비율)
  const doneCount = minors.filter((m) => m.status === 'DONE').length;
  const inProgressCount = minors.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'TOUCH_UP').length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // 대표 상태 색상 결정
  const statusColor =
    doneCount === total && total > 0
      ? '#4CAF50'
      : inProgressCount > 0
      ? '#2196F3'
      : '#9E9E9E';

  const statusText =
    doneCount === total && total > 0
      ? '완료'
      : inProgressCount > 0
      ? '진행 중'
      : '대기';

  return (
    <S.Card onClick={onClick}>
      {/* ── 상단 이미지 영역 ── */}
      <S.ImageArea gradient={theme.gradient}>
        <S.IconWrap
          dangerouslySetInnerHTML={{ __html: theme.icon }}
        />
        {/* 호버 시 나타나는 삭제 버튼 — 클릭이 카드로 전파되지 않도록 stopPropagation */}
        {onDelete && (
          <S.DeleteBtn
            onClick={(e) => { e.stopPropagation(); onDelete(major.id, major.name); }}
            title="대공정 삭제"
          >
            ✕
          </S.DeleteBtn>
        )}
        <S.ProgressBar progress={progress} />
      </S.ImageArea>

      {/* ── 하단 텍스트 영역 ── */}
      <S.TextArea>
        <S.ProcessName>{major.name}</S.ProcessName>
        <S.SubInfo>
          <S.StatusDot color={statusColor} />
          {statusText}
          {total > 0 && ` · 완료 ${doneCount}/${total}`}
        </S.SubInfo>
      </S.TextArea>
    </S.Card>
  );
}
