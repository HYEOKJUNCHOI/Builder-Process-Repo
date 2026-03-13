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
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
`;

/* 그리드 셀 래퍼 — 카드(100px) + 버튼(20px) 세로 묶음 */
export const TemplateGridItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/* 카드 본체 — 이미지 영역 80px + 이름 영역 20px = 100px */
export const TemplateBoxCard = styled.div`
  border-radius: ${theme.radius.md};
  background: ${({ $isDefault }) => ($isDefault ? theme.color.navy : '#fff')};
  border: ${({ $isDefault }) =>
    $isDefault ? 'none' : `1.5px solid ${theme.color.gray100}`};
  box-shadow: ${theme.shadow.sm};
  overflow: hidden;
  display: flex;
  flex-direction: column;

  /* 카드 호버 시 업로드 버튼 표시 */
  &:hover [data-qa="thumb-upload-btn"] {
    opacity: 1;
  }
`;

/* 이미지/아이콘 영역 — 80px 고정 높이, 상대 위치(업로드 버튼 기준) */
export const TemplateBoxIconWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 80px;
  background: ${({ $isDefault }) =>
    $isDefault ? 'rgba(255,255,255,0.12)' : theme.color.gray50};
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 10px;
  font-size: 26px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/* "예시" 뱃지 — 아이콘 영역 좌상단 절대 배치, +20px 오른쪽으로 이동 */
export const ExampleBadgeChip = styled.span`
  position: absolute;
  top: 7px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.22);
  color: rgba(255, 255, 255, 0.9);
  font-size: 7px;
  font-weight: ${theme.font.weight.semibold};
  padding: 1px 5px;
  border-radius: 5px;
  z-index: 1;
  letter-spacing: 0.3px;
`;

/* 📷 업로드 버튼 — 22×22, 기본 숨김, 호버 시 우측 하단 등장 */
export const TemplateBoxUploadBtn = styled.label`
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: ${theme.color.navy};
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  user-select: none;
`;

/* 이름 영역 — 20px 고정, 텍스트는 가로의 절반만 차지하도록 padding으로 여백 */
export const TemplateBoxName = styled.div`
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  font-size: 9px;
  font-weight: ${theme.font.weight.semibold};
  color: ${({ $isDefault }) => ($isDefault ? 'rgba(255,255,255,0.9)' : theme.color.navy)};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* 카드 외부 하단 사용 버튼 — 전체 너비, 높이 20px */
export const TemplateUseBtn = styled.button`
  width: 100%;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: ${({ $isDefault }) =>
    $isDefault ? theme.color.navy : theme.color.navy};
  color: #fff;
  font-size: 7px;
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
