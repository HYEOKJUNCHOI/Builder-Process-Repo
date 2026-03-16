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
  padding: 12px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HeaderTitle = styled.h2`
  font-size: ${theme.font.size.lg};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  margin: 0;
`;

export const LocationBadge = styled.span`
  font-size: 11px;
  color: ${theme.color.gray500};
  font-weight: ${theme.font.weight.medium};
`;

export const HeaderSub = styled.p`
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray400};
  margin: 0;
`;

/* 카테고리 스크롤 + > 버튼 래퍼 */
export const CategoryWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

/* 카테고리 필터 가로 스크롤 */
export const CategoryScroll = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 10px 0 12px;
  flex: 1;
  /* 스크롤바 숨김 */
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

/* 검색바 */
export const SearchInput = styled.input`
  width: 100%;
  height: 36px;
  border: 1px solid ${theme.color.gray200};
  border-radius: 18px;
  padding: 0 14px;
  font-size: 13px;
  color: ${theme.color.gray800};
  background: ${theme.color.gray50};
  outline: none;
  box-sizing: border-box;
  margin-bottom: 2px;

  &:focus {
    border-color: #293553;
    background: #fff;
  }

  &::placeholder { color: ${theme.color.gray400}; }
`;

/* < > 스크롤 버튼 */
export const ScrollMoreBtn = styled.button`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #293553;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.10);
  ${({ $left }) => $left ? 'margin-right: 4px;' : 'margin-left: 4px;'}
  margin-bottom: 2px;
  transition: background 0.15s;
  line-height: 1;

  &:hover { background: #f0f0f0; }
`;

export const CategoryChip = styled.button`
  flex-shrink: 0;
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid ${({ $active }) => ($active ? theme.color.navy : theme.color.gray200)};
  background: ${({ $active }) => ($active ? theme.color.navy : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : theme.color.gray600)};
  font-size: 12px;
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
`;

/* 4열 그리드 */
export const ListContainer = styled.ul`
  list-style: none;
  padding: 16px;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
`;

/* 카드 — ProcessRepo와 동일한 글래스모피즘 + 호버 */
export const ListItem = styled.li`
  border-radius: ${theme.radius.md};
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.12), 0 2px 8px rgba(31, 38, 135, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px) scale(1.06);
    box-shadow: 0 16px 48px rgba(31, 38, 135, 0.22);
  }

  /* 호버 시 액션 버튼 오버레이 + 숨기기 버튼 표시 */
  &:hover [data-qa="directory-actions"] {
    opacity: 1;
    pointer-events: auto;
  }

  &:hover [data-qa="directory-hide-btn"] {
    opacity: 1;
    pointer-events: auto;
  }
`;

/* 상단 이모지 영역 — 상대 위치(액션 버튼 기준) */
export const Avatar = styled.div`
  position: relative;
  width: 100%;
  height: 100px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
`;

/* 숨기기 X 버튼 — 이모지 영역 좌측 상단, 기본 숨김 → 카드 호버 시 등장 */
export const HideBtn = styled.button`
  position: absolute;
  top: 5px;
  left: 5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s, background 0.15s;

  &:hover { background: rgba(229, 57, 53, 0.85); }
`;

/* 거리 배지 — 이모지 영역 우측 상단 */
export const DistBadge = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 8px;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: ${theme.font.weight.semibold};
`;

/* 액션 버튼 오버레이 — 호버 시 이모지 영역 위에 등장 */
export const ActionArea = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(41, 53, 82, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
`;

export const InfoArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

export const InfoTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px 2px;
`;

export const VendorName = styled.strong`
  font-size: 11px;
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.gray800};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CategoryTag = styled.span`
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 8px;
  background: ${theme.color.navy};
  color: #fff;
  font-weight: ${theme.font.weight.semibold};
  flex-shrink: 0;
`;

export const TagRow = styled.div`
  display: flex;
  gap: 3px;
  flex-wrap: nowrap;
  overflow: hidden;
  padding: 0 8px 4px;
`;

export const TagChip = styled.span`
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 6px;
  background: ${theme.color.gray100};
  color: ${theme.color.gray700};
  white-space: nowrap;
`;

export const Desc = styled.p`
  font-size: 10px;
  color: ${theme.color.gray700};
  margin: 0;
  padding: 0 8px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* 이름 하단 바 — #293553 */
export const NameBar = styled.div`
  height: 26px;
  background: #293553;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: ${theme.font.weight.semibold};
  color: #fff;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* 더미 — 기존 코드와의 호환용 (미사용) */
export const ActionBtn_dummy = styled.div``;

/* 액션 버튼 그룹 — 기본 숨김, 호버 시 오버레이 등장 */
export const ActionBtnGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(8px);
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
`;

export const ActionBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${({ $color }) => $color || theme.color.navy};
  color: #fff;
  font-size: 15px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s, opacity 0.15s;

  &:hover {
    transform: scale(1.1);
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.95);
  }
`;

/* ─── FAB 그룹 — #root 오른쪽 바깥 회색 영역에 배치 ─── */
/* left 기준: 버튼 왼쪽 끝이 #root 오른쪽 끝(50%+340px)에서 300px 더 바깥에서 시작 */
/* → 버튼 너비 관계없이 콘텐츠와 절대 겹치지 않음 */
export const FabGroup = styled.div`
  position: fixed;
  bottom: 88px; /* BottomNav 위 */
  left: calc(50% + 340px + 8px);
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  z-index: 50;
`;

export const RegisterFab = styled.button`
  height: 44px;
  padding: 0 18px;
  border-radius: 22px;
  border: none;
  background: #293553;
  color: #fff;
  font-size: 13px;
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(41, 53, 82, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(41, 53, 82, 0.45);
  }
  &:active { transform: scale(0.97); }
`;

/* 숨긴 업체 / 돌아가기 버튼 — RegisterFab과 동일한 색상 */
export const HiddenFab = styled.button`
  height: 44px;
  padding: 0 18px;
  border-radius: 22px;
  border: none;
  background: ${({ $active }) => ($active ? '#fff' : '#293553')};
  color: ${({ $active }) => ($active ? '#293553' : '#fff')};
  border: ${({ $active }) => ($active ? '1.5px solid #293553' : 'none')};
  font-size: 13px;
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(41, 53, 82, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(41, 53, 82, 0.45);
  }
  &:active { transform: scale(0.97); }
`;

/* ─── 등록 바텀 시트 ─── */
export const SheetOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;       /* 수직 중앙 */
  justify-content: center;   /* 수평 중앙 */
  padding: 0 16px;           /* 그리드 좌우 여백과 동일 */
`;

export const Sheet = styled.div`
  width: 100%;
  max-width: 560px;          /* 두 선 사이 너비로 제한 */
  background: #fff;
  border-radius: 16px;       /* 모든 모서리 둥글게 */
  padding: 24px 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 16px 48px rgba(31, 38, 135, 0.22);
`;

/* 모달 상단 타이틀 행 — 제목 + 닫기 버튼 */
export const SheetTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const SheetCloseBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: ${theme.color.gray100};
  color: ${theme.color.gray600};
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;

  &:hover { background: ${theme.color.gray200}; }
`;

export const SheetTitle = styled.h3`
  font-size: ${theme.font.size.lg};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  margin: 0;
`;

export const RegisterForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FormLabel = styled.label`
  font-size: 12px;
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray600};
  margin-top: 10px;
`;

export const FormInput = styled.input`
  height: 42px;
  border: 1px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  padding: 0 12px;
  font-size: 14px;
  color: ${theme.color.gray800};
  outline: none;

  &:focus { border-color: #293553; }
`;

export const FormSelect = styled.select`
  height: 42px;
  border: 1px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  padding: 0 12px;
  font-size: 14px;
  color: ${theme.color.gray800};
  background: #fff;
  outline: none;

  &:focus { border-color: #293553; }
`;

export const FormNote = styled.p`
  font-size: 11px;
  color: ${theme.color.gray400};
  margin: 8px 0 0;
`;

/* 사진 업로드 — 클릭 시 파일 선택 */
export const PhotoUploadLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 72px;
  border: 1.5px dashed ${theme.color.gray300};
  border-radius: ${theme.radius.md};
  padding: 0 14px;
  cursor: pointer;
  font-size: 13px;
  color: ${theme.color.gray500};
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #293553;
    background: ${theme.color.gray50};
  }
`;

/* 사진 미리보기 — 업로드 후 썸네일 표시 */
export const PhotoPreview = styled.img`
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
`;

export const FormSubmitBtn = styled.button`
  height: 48px;
  margin-top: 16px;
  border: none;
  border-radius: ${theme.radius.md};
  background: #293553;
  color: #fff;
  font-size: 15px;
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  transition: opacity 0.15s;

  &:active { opacity: 0.8; }
`;
