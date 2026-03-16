import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

export const Page = styled.div`
  min-height: 100vh;
  padding-top: 52px;
  padding-bottom: 72px;
  background: ${theme.color.bg};
`;

/* ── 3단 분할 레이아웃 적용 (최소 침해 원칙 / [앵커 불변]) ── */
export const LeftSidebarWrapper = styled.div`
  position: fixed;
  /*
   * 앱(680px) 중심 기준:
   *   앱 왼쪽 끝 = 50% - 340px
   *   사이드바 오른쪽 끝 = 앱 왼쪽 끝 - 20px(간격) = 50% - 360px
   *   사이드바 왼쪽 끝 = 50% - 360px - 200px(너비) = 50% - 560px
   *   → 최소 뷰포트: 560×2 = 1120px 이상이어야 짤리지 않음
   */
  left: calc(50% - 560px);
  top: 132px;
  width: 200px;
  /* 화면 아래로 넘치지 않도록 최대 높이 제한 (내부 스크롤은 NavScrollArea가 담당) */
  max-height: calc(100vh - 152px);
  background: #fff;
  border-radius: ${theme.radius.xl};
  box-shadow: ${theme.shadow.sm};
  border: 1px solid ${theme.color.gray200};
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 5;

  @media (max-width: 1120px) {
    /* 1120px 이하에서는 좌측 사이드바가 화면 밖으로 짤리므로 숨김 */
    display: none;
  }
`;

export const RightSidebarWrapper = styled.aside`
  position: fixed;
  /*
   * 앱(680px) 중심 기준:
   *   앱 오른쪽 끝 = 50% + 340px
   *   사이드바 왼쪽 끝 = 앱 오른쪽 끝 + 20px(간격) = 50% + 360px
   *   사이드바 오른쪽 끝 = 50% + 360px + 200px(너비) = 50% + 560px
   *   → 최소 뷰포트: 560×2 = 1120px 이상이어야 짤리지 않음
   */
  left: calc(50% + 360px);
  top: 132px; /* 왼쪽 사이드바와 동일한 높이에서 시작 */
  width: 200px;
  /* 높이 제한이 있어야 overflow-y: scroll의 스크롤 범위가 생겨 휠을 흡수할 수 있음 */
  max-height: calc(100vh - 152px);
  background: #fff;
  border-radius: ${theme.radius.xl};
  box-shadow: ${theme.shadow.sm};
  border: 1px solid ${theme.color.gray200};
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 5;
  /* scroll: 내용이 없어도 항상 스크롤 컨테이너로 등록 → 휠 이벤트를 페이지에 넘기지 않음 */
  overflow-y: scroll;
  /* 경계 도달 시 페이지로 전파 차단 */
  overscroll-behavior: contain;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  @media (max-width: 1120px) {
    /* 1120px 이하에서는 우측 사이드바가 화면 밖으로 짤리므로 숨김 */
    display: none;
  }
`;

/* 좌측 사이드바: 타이틀 고정 + 목록만 스크롤되는 내부 영역 */
export const NavScrollArea = styled.div`
  flex: 1;
  /* scroll: 내용이 없어도 항상 스크롤 컨테이너로 등록 → 휠 이벤트를 페이지에 넘기지 않음 */
  overflow-y: scroll;
  /* 경계 도달 시 페이지로 전파 차단 */
  overscroll-behavior: contain;
  /* 스크롤바 시각적으로 숨김 (기능은 유지) */
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
`;

/* 좌측 내비게이션 아이템 */
export const NavItem = styled.div`
  padding: 10px 14px;
  border-radius: ${theme.radius.md};
  background: ${({ active }) => (active ? '#f5f4f1' : 'transparent')};
  color: ${({ active }) => (active ? theme.color.navy : theme.color.gray600)};
  font-weight: ${({ active }) => (active ? theme.font.weight.bold : theme.font.weight.medium)};
  font-size: ${theme.font.size.sm};
  box-shadow: ${({ active }) => (active ? 'inset 0 0 0 1px rgba(0,0,0,0.05)' : 'none')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ active }) => (active ? '#f5f4f1' : theme.color.gray100)};
  }
`;

export const RightPanelTitle = styled.h3`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '✨';
  }
`;

export const TargetMajorBadge = styled.div`
  display: inline-block;
  padding: 6px 12px;
  background: ${theme.color.bg};
  border: 1.5px solid ${theme.color.navy};
  color: ${theme.color.navy};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.xs};
  font-weight: ${theme.font.weight.bold};
  margin-bottom: 4px;
  text-align: center;
`;

export const GlobalAddFormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const GlobalAddLabel = styled.label`
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray700};
  font-weight: ${theme.font.weight.medium};
`;

export const GlobalAddInput = styled.input`
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  outline: none;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray800};
  &:focus { border-color: ${theme.color.navy}; }
`;

export const GlobalAddTextarea = styled.textarea`
  width: 100%;
  height: 60px;
  padding: 8px 10px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  outline: none;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray800};
  resize: vertical;
  &:focus { border-color: ${theme.color.navy}; }
`;

export const GlobalAddModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

/* 공정 레퍼런스 저장 버튼 — 추가하기 버튼 아래 빈 공간에 배치 */
export const SaveTemplateBtn = styled.button`
  width: 100%;
  height: 38px;
  margin-top: 4px;
  border: 1.5px dashed ${theme.color.navy};
  border-radius: ${theme.radius.md};
  background: none;
  font-size: ${theme.font.size.xs};
  color: ${theme.color.navy};
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${theme.font.weight.medium};
  opacity: 0.75;

  &:hover {
    background: ${theme.color.gray50};
    opacity: 1;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const GlobalAddSubmitBtn = styled.button`
  flex: 1;
  height: 44px;
  border: none;
  background: ${theme.color.navy};
  border-radius: ${theme.radius.md};
  color: #fff;
  font-weight: ${theme.font.weight.bold};
  cursor: pointer;
  &:hover { background: #1e2840; }
  &:disabled {
    background: ${theme.color.gray300};
    cursor: not-allowed;
  }
`;



export const Header = styled.header`
  position: sticky;
  top: 52px; /* TopBar(fixed 52px) 바로 아래 */
  z-index: 15; /* TopBar(10)와 사이드바(5)보다 높게 또는 사이에 적절히 배치. 사이드바 위로 올리기 위해 15 부여 */
  background: #fff;
  box-shadow: 0 2px 6px rgba(41, 53, 82, 0.07);
  padding: 10px 20px;
  display: flex;
  flex-direction: column; /* HeaderRow 1개만 사용 */
  gap: 8px;
`;

/* 헤더 내 한 행 — 타이틀+아이콘 행, 현장선택+날씨 행 공통 사용 */
export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

export const HeaderTitle = styled.h2`
  flex-shrink: 0;        /* 텍스트 길이만큼만 차지 */
  white-space: nowrap;
  font-size: ${theme.font.size.lg};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px; /* 날씨 텍스트와 약간의 간격 */
`;

export const ProjectSelect = styled.select`
  flex: 1;
  min-width: 0;
  max-width: 450px;
  height: 36px;
  padding: 0 12px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray700};
  background: #fff;
  outline: none;
`;

/* 내일 예상 날씨 — 현장 드롭다운 오른쪽 표시 */
export const TomorrowWeather = styled.span`
  flex-shrink: 0;
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray500};
  white-space: nowrap;
`;

/* 헤더 수정/삭제 아이콘 버튼 */
export const HeaderIconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  background: none;
  border-radius: ${theme.radius.sm};
  font-size: 16px;
  cursor: pointer;
  color: ${({ danger }) => (danger ? theme.color.danger : theme.color.gray500)};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${({ danger }) => (danger ? '#fff1f0' : theme.color.gray100)};
    color: ${({ danger }) => (danger ? theme.color.danger : theme.color.navy)};
  }
`;

/* ── 대공정 섹션 (무한 스크롤 형태) ── */
export const MajorSection = styled.section`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  /* 선택 시 왼쪽 강조선 — box-shadow로 레이아웃 밀림 없음 */
  box-shadow: ${({ $selected }) => ($selected ? `inset 3px 0 0 ${theme.color.navy}` : 'none')};
  transition: box-shadow 0.1s;
`;

export const MajorHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 20px 8px;
  cursor: pointer;
  user-select: none;
`;

export const MajorTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px; /* 이름과 체크 버튼 사이 간격 */
  font-size: ${theme.font.size.xxl};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  margin: 0;
`;

export const MajorCheckBtn = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0 4px;

  font-size: ${theme.font.size.xl};
  font-weight: 800;
  color: ${({ done }) => (done ? '#e03a3e' : 'transparent')}; /* V 표시 색상을 테마에 맞추거나 이미지처럼 붉은색/초록색으로. 이미지에서는 빨간 체크처럼 보임 */
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.15);
  }
  &:active {
    transform: scale(0.94);
  }
`;

export const MajorDivider = styled.hr`
  margin: 0 20px;
  border: none;
  border-top: 1.5px solid ${theme.color.navy}; /* 확실한 경계 구분선 */
`;

/* ── 메인 화면용 소공정 리스트 컨테이너 (바텀시트의 MinorList 재활용) ── */
export const MainMinorList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
`;

export const SidebarActionBtn = styled.button`
  width: 100%;
  height: 38px;
  border: 1.5px dashed ${theme.color.site.beige};
  border-radius: ${theme.radius.md};
  background: none;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.site.beige};
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${theme.font.weight.semibold};

  &:hover {
    border-color: ${theme.color.navy};
    color: ${theme.color.navy};
    background: ${theme.color.gray50};
  }
`;



/* 사이드바 전용 대공정 추가 폼 — 세로 스택 */
export const SidebarAddForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const SidebarAddActions = styled.div`
  display: flex;
  gap: 6px;
`;

/* ── 버튼들 ── */
export const AddBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: calc(100% - 32px);
  margin: 14px 16px 0;
  height: 44px;
  border: 1.5px dashed ${theme.color.site.beige};  /* 베이지 포인트 */
  border-radius: ${theme.radius.md};
  background: none;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.site.beige};
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: ${theme.color.navy};
    color: ${theme.color.navy};
  }
`;

export const NewProjectBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 32px);
  margin: 16px 16px 0;
  height: 48px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
`;

/* ── 인라인 대공정 추가 입력 ── */
export const AddRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 16px 0;
`;

export const AddInput = styled.input`
  flex: 1;
  height: 42px;
  padding: 0 14px;
  border: 1.5px solid ${theme.color.navy};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.sm};
  outline: none;
`;

export const AddConfirmBtn = styled.button`
  height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.sm};
  cursor: pointer;
`;

export const AddCancelBtn = styled.button`
  height: 42px;
  padding: 0 12px;
  border: 1px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  background: none;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray500};
  cursor: pointer;
`;

export const EmptyMsg = styled.p`
  padding: 48px 20px;
  text-align: center;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray300};
  white-space: pre-line;
`;

/* ── 소공정 바텀시트 ── */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 200;
  display: flex;
  align-items: center;       /* 바텀시트 → 중앙 정렬 */
  justify-content: center;
  padding: 0 16px;
`;

export const Sheet = styled.div`
  width: 100%;
  max-width: ${theme.maxWidth};
  max-height: 80vh;
  background: #fff;
  border-radius: ${theme.radius.xl};   /* 4면 모두 둥글게 */
  box-shadow: 0 16px 48px rgba(31, 38, 135, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

/* ── 커스텀 프롬프트 모달 (window.prompt 대체) ── */
export const PromptOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
`;

export const PromptBox = styled.div`
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: ${theme.radius.xl};
  box-shadow: 0 16px 48px rgba(31, 38, 135, 0.22);
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const PromptMessage = styled.p`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.navy};
  margin: 0;
`;

export const PromptInput = styled.input`
  height: 42px;
  border: 1px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  padding: 0 12px;
  font-size: 14px;
  color: ${theme.color.gray800};
  outline: none;
  font-family: inherit;

  &:focus { border-color: #293553; }
`;

export const PromptActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const PromptBtn = styled.button`
  height: 38px;
  padding: 0 18px;
  border-radius: ${theme.radius.md};
  border: none;
  font-size: 13px;
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  transition: opacity 0.15s;
  background: ${({ $primary }) => ($primary ? '#293553' : theme.color.gray100)};
  color: ${({ $primary }) => ($primary ? '#fff' : theme.color.gray600)};
  font-family: inherit;

  &:active { opacity: 0.8; }
`;

export const SheetHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.color.gray200};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

export const SheetTitle = styled.h3`
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.gray800};
  flex: 1;
`;

export const SheetActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CloseBtn = styled.button`
  border: none;
  background: none;
  font-size: 20px;
  color: ${theme.color.gray400};
  cursor: pointer;
  line-height: 1;
`;

export const DeleteMajorBtn = styled.button`
  border: 1px solid ${theme.color.gray200};
  background: none;
  padding: 5px 12px;
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.xs};
  color: ${theme.color.danger};
  cursor: pointer;
`;

export const SheetBody = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const MinorList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const MinorItem = styled.li`
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
  border-bottom: 1px solid ${theme.color.gray100};
  /* 선택 시 왼쪽 강조 — box-shadow로 레이아웃 밀림 없음 */
  box-shadow: ${({ $selected }) => ($selected ? `inset 6px 0 0 ${theme.color.navy}` : 'none')};
  background: ${({ $selected }) => ($selected ? theme.color.gray50 : 'transparent')};
  cursor: pointer;
  transition: background 0.1s, box-shadow 0.1s;

  &:last-child { border-bottom: none; }
`;

/* 소공정 한 줄 (상태·이름·버튼들) */
export const MinorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const StatusBtn = styled.button`
  flex-shrink: 0;
  width: 48px;
  height: 24px;
  border-radius: 12px;
  border: 1px solid ${({ status }) =>
    status === 'WAITING' ? theme.color.gray300
      : status === 'IN_PROGRESS' ? '#1565C0'
        : status === 'TOUCH_UP' ? '#FFB74D'
          : theme.color.green};
  background: ${({ status }) =>
    status === 'WAITING' ? '#fff'
      : status === 'IN_PROGRESS' ? '#EBF3FF'
        : status === 'TOUCH_UP' ? '#FFF3E0'
          : '#E8F5E9'};
  color: ${({ status }) =>
    status === 'WAITING' ? theme.color.gray600
      : status === 'IN_PROGRESS' ? '#1565C0'
        : status === 'TOUCH_UP' ? '#E65100'
          : theme.color.green};
  font-size: 11px;
  font-weight: ${theme.font.weight.bold};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active { opacity: 0.7; }
`;

import { keyframes } from '@emotion/react';

/* 구름처럼 떠오르는 애니메이션 */
const popIn = keyframes`
  0% { opacity: 0; transform: scale(0.9) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
`;

/* ── 상태 팝오버 ── */
export const StatusPopover = styled.div`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow: hidden;
  min-width: 60px;
  animation: ${popIn} 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: white;
  }
  &::before {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 7px solid transparent;
    border-top-color: ${theme.color.gray200};
    z-index: -1;
  }
`;

export const StatusOption = styled.button`
  border: none;
  background: none;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: ${theme.font.weight.semibold};
  color: ${({ status }) =>
    status === 'WAITING' ? theme.color.gray600
      : status === 'IN_PROGRESS' ? '#1565C0'
        : status === 'TOUCH_UP' ? '#E65100'
          : theme.color.green};
  text-align: center;
  cursor: pointer;
  white-space: nowrap;

  &:hover { background: ${theme.color.gray50}; }
  &:active { background: ${theme.color.gray100}; }

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.color.gray100};
  }
`;

export const MinorName = styled.span`
  flex: 1;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray800};
`;

export const TodayBtn = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: ${({ active }) => (active ? '#FFB300' : theme.color.gray200)};
  transition: color 0.15s;
  padding: 2px;
`;

export const DeleteIconBtn = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  color: ${theme.color.gray300};
  font-size: 14px;
  line-height: 1;
  transition: color 0.15s;

  &:hover { color: ${theme.color.danger}; }
`;

/* 📝 일지 작성 이동 버튼 */
export const ReportIconBtn = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.15s;

  &:hover { opacity: 1; }
`;

/* ── 구분선 아이템 (DIVIDER_NAME 마커일 때 렌더링) ── */
export const DividerItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 20px;
`;

export const DividerLine = styled.hr`
  flex: 1;
  border: none;
  border-top: 1.5px dashed ${theme.color.gray200};
  margin: 0;
`;

export const TaskReportBtn = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  font-size: ${({ reported }) => (reported ? '16px' : '14px')};
  line-height: 1;
  opacity: ${({ reported }) => (reported ? '0.85' : '0.7')};
  transition: opacity 0.15s, transform 0.1s;
  ${({ reported }) => reported && `filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));`}

  &:hover {
    opacity: 1;
    transform: scale(1.15);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

export const MemoToggleBtn = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  line-height: 1;
  color: ${({ active }) => (active ? theme.color.navy : theme.color.gray300)};
  transition: color 0.15s;

  &:hover { color: ${theme.color.navy}; }
`;

/* 메모가 있을 때 접힌 상태에서 보이는 미리보기 */
export const MemoPreview = styled.p`
  margin-top: 4px;
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray400};
  padding-left: 66px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* 메모 편집 영역 */
export const MemoArea = styled.div`
  display: flex;
  gap: 8px;
  align-items: stretch; /* 텍스트에어리아와 버튼 컬럼이 같은 높이로 늘어남 */
  margin-top: 8px;
`;

export const MemoTextarea = styled.textarea`
  flex: 1;
  padding: 8px 10px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray700};
  resize: none;
  min-height: 60px;
  outline: none;
  font-family: inherit;
  line-height: 1.5;

  &:focus { border-color: ${theme.color.navy}; }
  &::placeholder { color: ${theme.color.gray300}; }
`;

/* 저장/취소 버튼을 세로로 묶는 컬럼 */
export const MemoBtnCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
`;

export const MemoSaveBtn = styled.button`
  height: 34px;
  padding: 0 12px;
  border: none;
  border-radius: ${theme.radius.sm};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.xs};
  cursor: pointer;
`;

/* 취소 버튼 — 저장 아래 남은 공간 채움 */
export const MemoCancelBtn = styled.button`
  flex: 1;
  padding: 0 12px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  background: #fff;
  color: ${theme.color.gray600};
  font-size: ${theme.font.size.xs};
  cursor: pointer;

  &:hover { border-color: ${theme.color.gray300}; background: ${theme.color.gray100}; }
`;

/* 소공정 추가 — 이름 행 + 메모 행을 묶는 컨테이너 */
export const SheetAddRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 20px;
  border-top: 1px solid ${theme.color.gray100};
  flex-shrink: 0;
`;

/* 이름 입력 + 추가 버튼 한 줄 */
export const SheetAddTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SheetAddInput = styled.input`
  flex: 1;
  height: 42px;
  padding: 0 14px;
  border: 1.5px solid ${theme.color.navy};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.sm};
  outline: none;
`;

export const SheetAddBtn = styled.button`
  height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.sm};
  cursor: pointer;
`;

/* 메모 입력란 (선택) */
export const SheetMemoInput = styled.textarea`
  width: 100%;
  padding: 8px 10px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray700};
  resize: none;
  height: 52px;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
  box-sizing: border-box;

  &:focus { border-color: ${theme.color.navy}; }
  &::placeholder { color: ${theme.color.gray300}; }
`;

/* ── 현장 생성 바텀시트 ── */
export const FormSheet = styled(Sheet)`
  max-height: 90vh;
`;

export const FormSheetHeader = styled(SheetHeader)``;
export const FormSheetTitle = styled(SheetTitle)``;

export const FormSheetBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FormLabel = styled.label`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.medium};
  color: ${theme.color.gray600};
`;

export const FormRequired = styled.span`
  color: ${theme.color.danger};
  margin-left: 2px;
`;

export const FormInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray800};
  box-sizing: border-box;
  outline: none;

  &:focus { border-color: ${theme.color.navy}; }
  &::placeholder { color: ${theme.color.gray300}; }
`;

export const FormSelect = styled.select`
  width: 100%;
  height: 44px;
  padding: 0 36px 0 14px; /* 오른쪽: 커스텀 화살표 공간 확보 */
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray800};
  background-color: #fff;
  /* 네이티브 화살표 제거 → 커스텀 SVG 화살표로 대체 (오른쪽에서 20px 안쪽 배치) */
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: calc(100% - 20px) center;
  outline: none;

  &:focus { border-color: ${theme.color.navy}; }
`;

export const FormRow = styled.div`
  display: flex;
  gap: 10px;

  & > * { flex: 1; }
`;

export const SubmitBtn = styled.button`
  width: 100%;
  height: 50px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  margin-top: 4px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── 선택된 항목 키보드 안내 뱃지 — 선택 시 인라인 pill로 표시 ── */
export const KeyboardHint = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 9px;
  color: #fff;
  background: ${theme.color.navy};
  border-radius: 10px;
  padding: 2px 7px;
  font-weight: ${theme.font.weight.semibold};
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;
`;

/* 대공정 완료 체크 아이콘 — done=true: 초록 채움 원, false: 회색 테두리 원 */
export const MajorCheckIcon = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer; /* 클릭 가능하도록 변경 */
  transition: transform 0.15s, box-shadow 0.15s;

  width:  ${({ done }) => (done ? '22px' : '18px')};
  height: ${({ done }) => (done ? '22px' : '18px')};
  background: ${({ done }) => (done ? '#3cb878' : 'transparent')};
  border: ${({ done }) => (done ? 'none' : '2px solid #c8c4be')};
  font-size: ${({ done }) => (done ? '13px' : '11px')};
  font-weight: 700;
  color: ${({ done }) => (done ? '#fff' : '#b0aca6')};
  line-height: 1;
  padding: 0;

  &:hover {
    transform: scale(1.12);
    box-shadow: ${({ done }) =>
    done
      ? '0 2px 8px rgba(60,184,120,0.35)'
      : '0 1px 4px rgba(0,0,0,0.12)'};
  }
  &:active { transform: scale(0.94); }
`;

