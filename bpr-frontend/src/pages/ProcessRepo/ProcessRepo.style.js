import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

export const Page = styled.div`
  min-height: 100vh;
  padding-top: 52px;
  padding-bottom: 72px;
  background: ${theme.color.bg};
`;

export const Header = styled.header`
  position: sticky;
  top: 52px;
  z-index: 10;
  background: #fff;
  box-shadow: 0 2px 6px rgba(41, 53, 82, 0.07);
  padding: 12px 20px;
`;

export const HeaderTitle = styled.h2`
  font-size: ${theme.font.size.lg};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
`;

export const HeaderSub = styled.p`
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray400};
  margin-top: 2px;
`;

/* 전체 콘텐츠 영역 */
export const Content = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/* ───────────────────────────────────────────────
   통합 템플릿 그리드 — 5열
   ─────────────────────────────────────────────── */

export const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

/* 그리드 셀 래퍼 — 카드(100px) + 버튼(20px) 세로 묶음 */
export const TemplateGridItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/* 카드 본체 — 글래스모피즘 효과, 호버 시 scale + 색상 반전 */
export const TemplateBoxCard = styled.div`
  border-radius: ${theme.radius.md};
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.12), 0 2px 8px rgba(31,38,135,0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  /* CSS 변수 — 기본값 정의, 호버 시 반전 */
  --icon-bg: #f0f0f0;
  --name-bg: #293553;
  --name-color: #fff;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px) scale(1.08);
    box-shadow: 0 16px 48px rgba(31, 38, 135, 0.22);
    /* 아이콘 영역 ↔ 이름표 색상 반전 */
    --icon-bg: #293553;
    --name-bg: #f0f0f0;
    --name-color: #293553;
  }

  /* 호버 시 이름 텍스트 전환 */
  &:hover .name-text { display: none; }
  &:hover .hover-text { display: flex; }

  /* 카드 호버 시 업로드·삭제 버튼 표시 */
  &:hover [data-qa="thumb-upload-btn"],
  &:hover [data-qa="thumb-delete-btn"] {
    opacity: 1;
  }
`;

/* 이미지/아이콘 영역 — 170px 고정 높이, 상대 위치(업로드 버튼 기준) */
export const TemplateBoxIconWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 170px;
  /* CSS 변수로 카드 호버 시 #dbdbdb ↔ #293553 반전 */
  background: var(--icon-bg, #f0f0f0);
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  overflow: hidden;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/* "예시" 뱃지 — 아이콘 영역 상단 중앙 절대 배치 */
export const ExampleBadgeChip = styled.span`
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(41, 53, 82, 0.75);
  color: #fff;
  font-size: 13px;
  font-weight: ${theme.font.weight.semibold};
  padding: 3px 10px;
  border-radius: 8px;
  z-index: 1;
  letter-spacing: 0.3px;
`;

/* ✕ 삭제 버튼 — 26×26, 기본 숨김, 호버 시 우측 상단 등장 */
export const TemplateBoxDeleteBtn = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.92);
  color: #e53935;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  z-index: 2;

  &:hover {
    background: #e53935;
    color: #fff;
  }
`;

/* 📷 업로드 버튼 — 34×34, 기본 숨김, 호버 시 우측 하단 등장 */
export const TemplateBoxUploadBtn = styled.label`
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: ${theme.color.navy};
  font-size: 18px;
  line-height: 1;
  padding-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  user-select: none;
`;

/* 이름 영역 — 30px 고정, CSS 변수로 호버 시 배경·텍스트 반전 */
export const TemplateBoxName = styled.div`
  height: 30px;
  background: var(--name-bg, #293553);
  transition: background-color 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  font-size: 12px;
  font-weight: ${theme.font.weight.semibold};
  color: var(--name-color, #fff);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;

  /* 기본 이름 텍스트 */
  .name-text {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 호버 시 대체 텍스트 — 기본 숨김 */
  .hover-text {
    display: none;
    align-items: center;
    justify-content: center;
    width: 100%;
    font-size: 11px;
    letter-spacing: 0.3px;
  }
`;

/* 카드 외부 하단 사용 버튼 — 전체 너비, 높이 28px */
export const TemplateUseBtn = styled.button`
  width: 100%;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: ${({ $isDefault }) =>
    $isDefault ? theme.color.navy : theme.color.navy};
  color: #fff;
  font-size: 11px;
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.75;
  }
`;

/* ───────────────────────────────────────────────
   대공정 / 소공정 펼침 영역
   ─────────────────────────────────────────────── */
export const MajorSection = styled.div`
  border-bottom: 1px solid ${theme.color.gray100};

  &:last-of-type {
    border-bottom: none;
  }
`;

export const MajorRow = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: ${theme.color.gray50};
  gap: 8px;
`;

export const MajorOrder = styled.span`
  font-size: 11px;
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  min-width: 18px;
`;

export const MajorName = styled.span`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray700};
`;

export const MinorList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const MinorItem = styled.li`
  padding: 8px 16px 8px 42px;
  border-top: 1px solid ${theme.color.gray100};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray600};
`;

export const EmptyMsg = styled.p`
  padding: 48px 20px;
  text-align: center;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray300};
`;
