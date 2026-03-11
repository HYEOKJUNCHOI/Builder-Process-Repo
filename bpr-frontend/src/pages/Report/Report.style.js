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
  top: 52px; /* TopBar(fixed 52px) 바로 아래 */
  z-index: 10;
  background: #fff;
  box-shadow: 0 2px 6px rgba(41, 53, 82, 0.07);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const HeaderTitle = styled.h2`
  flex-shrink: 0;       /* 타이틀은 텍스트 크기 그대로, 드롭다운이 나머지 공간 차지 */
  white-space: nowrap;
  font-size: ${theme.font.size.lg};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
`;

export const ProjectSelect = styled.select`
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray700};
  background: #fff;
  outline: none;
`;

export const NewReportBtn = styled.button`
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: ${theme.radius.sm};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  white-space: nowrap;
`;

/** 이전 보고서 버튼 */
export const HistoryBtn = styled.button`
  height: 36px;
  padding: 0 12px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  background: none;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray600};
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: ${theme.color.navy};
    color: ${theme.color.navy};
  }
`;

/** 초기화 버튼 — 오렌지 계열로 구분 */
export const ResetBtn = styled.button`
  height: 36px;
  padding: 0 12px;
  border: 1.5px solid #e5910033;
  border-radius: ${theme.radius.sm};
  background: none;
  font-size: ${theme.font.size.sm};
  color: #c97800;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: #c97800;
    background: #fff8ee;
  }
`;


export const Content = styled.div`
  padding: 16px 0 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/* ── 날짜·날씨 다크 카드 — 날짜(좌) + 날씨(우) 한 줄 배치 ── */
export const DarkCard = styled.div`
  margin: 0 16px;
  background: ${theme.color.navy};
  border-radius: ${theme.radius.lg};
  padding: 18px 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const DarkCardDate = styled.h2`
  font-size: 20px;
  font-weight: ${theme.font.weight.bold};
  color: #fff;
  line-height: 1.2;
  flex: 1;
`;

export const DarkCardWeather = styled.p`
  flex-shrink: 0;
  font-size: ${theme.font.size.sm};
  color: rgba(255, 255, 255, 0.85);
  text-align: right;
`;

export const DarkCardProject = styled.p`
  font-size: ${theme.font.size.sm};
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
`;

/* 날씨 + 주소를 나란히 배치하는 행 */
export const DarkCardRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
`;

/* 현장명 + 주소 — 크게 표시 */
export const DarkCardAddress = styled.p`
  flex: 1;
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  color: #fff;
  white-space: pre-line;
  line-height: 1.5;
`;

/* ── 섹션 공통 ── */
export const SectionBox = styled.div`
  margin: 0 16px;
  background: #fff;
  border-radius: ${theme.radius.lg};
  /* overflow: hidden; 삭제 → 팝오버가 카드 밖으로 그려질 수 있도록 허용 */
  box-shadow: ${theme.shadow.sm};
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid ${theme.color.gray100};
`;

export const SectionIcon = styled.span`
  font-size: 15px;
`;

export const SectionTitle = styled.h3`
  flex: 1;
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray800};
`;

export const SectionCount = styled.span`
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray400};
  background: ${theme.color.gray100};
  padding: 2px 8px;
  border-radius: ${theme.radius.full};
`;

/* ── 오늘 추가된 공정 목록 ── */
export const ProcessList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const ProcessItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid ${theme.color.gray100};

  &:last-child { border-bottom: none; }
`;

/** 일지 공정 항목 메모 토글 버튼 — ✎ 아이콘, 메모 있으면 남색 강조 */
export const ProcessMemoToggleBtn = styled.button`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.radius.full};
  color: ${({ active }) => (active ? theme.color.navy : theme.color.gray300)};
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: ${theme.color.navy};
    background: ${theme.color.gray100};
  }
`;

/** 메모 편집 영역 — textarea + 저장 버튼 */
export const ProcessMemoArea = styled.div`
  padding: 8px 16px 10px;
  display: flex;
  gap: 8px;
  align-items: stretch;
  background: ${theme.color.gray50};
  border-top: 1px solid ${theme.color.gray100};
`;

export const ProcessMemoBtnCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
`;

export const ProcessMemoCancelBtn = styled.button`
  flex: 1;
  padding: 0 14px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  background: #fff;
  color: ${theme.color.gray600};
  font-size: ${theme.font.size.sm};
  cursor: pointer;

  &:hover { border-color: ${theme.color.gray300}; background: ${theme.color.gray100}; }
`;

export const ProcessMemoTextarea = styled.textarea`
  flex: 1;
  min-height: 52px;
  padding: 8px 10px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray700};
  resize: none;
  font-family: inherit;
  line-height: 1.5;
  box-sizing: border-box;
  outline: none;

  &:focus { border-color: ${theme.color.navy}; }
  &::placeholder { color: ${theme.color.gray300}; }
`;

export const ProcessMemoSaveBtn = styled.button`
  flex-shrink: 0;
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: ${theme.radius.sm};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/** 일지 공정 항목 삭제 버튼 — 항목 오른쪽 끝 ✕ */
export const DeleteItemBtn = styled.button`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: ${theme.color.gray300};
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.radius.full};
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: #e53e3e;
    background: #fff5f5;
  }
`;

export const CheckIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: ${theme.radius.sm};
  background: #E8F5E9;
  color: #2E7D32;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: ${theme.font.weight.bold};
  flex-shrink: 0;
  margin-top: 1px;
`;

export const ProcessInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ProcessName = styled.span`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray800};
`;

export const ProcessSub = styled.span`
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray400};
`;

/* ── 현장 사진 그리드 ── */
export const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 16px 16px;
`;

/* 사진 추가 버튼 — 섹션 헤더 우측에 배치 */
export const AddPhotoBtn = styled.button`
  margin-left: auto;
  flex-shrink: 0;
  height: 30px;
  padding: 0 12px;
  border: 1.5px solid ${theme.color.navy};
  border-radius: ${theme.radius.sm};
  background: none;
  color: ${theme.color.navy};
  font-size: ${theme.font.size.xs};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${theme.color.navy};
    color: #fff;
  }
`;

/* 도면 추가 버튼 — AddPhotoBtn 오른쪽 나란히 배치 */
export const AddBlueprintBtn = styled(AddPhotoBtn)`
  margin-left: 6px;
  border-color: #7c6c55;
  color: #7c6c55;

  &:hover {
    background: #7c6c55;
    color: #fff;
  }
`;

/* 현장사진 2열 정사각 그리드 — 648/2 = 324px 기준 */
export const PhotoGrid2Col = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px 16px 4px;
`;

/* 정사각 사진 카드 — 1:1 비율, object-fit:cover */
export const PhotoSquare = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: ${theme.radius.md};
  overflow: hidden;
  background: ${theme.color.gray100};
`;

/* 사진 카드 세로 나열 컨테이너 */
export const PhotoStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 16px;
`;

/* 개별 사진 카드 — 400×250 비율 */
export const PhotoCard = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 400 / 250; /* 400×250 비율 — 원하는 수치로 자유롭게 조절 가능 */
  border-radius: ${theme.radius.md};
  overflow: hidden;
  background: ${theme.color.gray100};
`;

export const PhotoSlot = styled.label`
  aspect-ratio: 1;
  border-radius: ${theme.radius.md};
  border: 1.5px dashed ${theme.color.gray200};
  background: ${theme.color.gray50};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: border-color 0.15s;

  &:hover { border-color: ${theme.color.navy}; }
`;

export const PhotoPreview = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain; /* cover는 이미지를 잘라내므로, 도면 전체가 보이도록 contain 사용 */
  background: #fff;    /* 이미지 여백 영역 흰 배경 */
`;

export const PhotoPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const PhotoPlus = styled.span`
  font-size: 24px;
  color: ${theme.color.gray300};
  line-height: 1;
`;

export const PhotoLabel = styled.span`
  font-size: 10px;
  color: ${theme.color.gray300};
`;

export const DeletePhotoBtn = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

/* ── 추가 메모 ── */
export const MemoTextarea = styled.textarea`
  width: 100%;
  min-height: 90px;
  padding: 12px 16px;
  border: none;
  resize: none;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray700};
  font-family: inherit;
  line-height: 1.6;
  box-sizing: border-box;
  outline: none;
  background: transparent;

  &::placeholder { color: ${theme.color.gray300}; }
`;

export const MemoSaveBtn = styled.button`
  width: calc(100% - 32px);
  margin: 0 16px 14px;
  height: 44px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/* ── 일지 카드 목록 ── */
export const CardList = styled.div`
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ReportCard = styled.div`
  background: #fff;
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadow.sm};
  padding: 14px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: box-shadow 0.15s;

  &:active {
    box-shadow: none;
  }
`;

export const CardDate = styled.span`
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.navy};
  min-width: 90px;
`;

export const CardMeta = styled.span`
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray400};
  flex: 1;
`;

export const CardArrow = styled.span`
  font-size: 14px;
  color: ${theme.color.gray300};
`;

export const EmptyMsg = styled.p`
  padding: 48px 20px;
  text-align: center;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray300};
`;

/* ── 일지 상세 / 작성 오버레이 ── */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: center;    /* 모달: 중앙 정렬 */
  justify-content: center;
  padding: 0 16px;        /* 좌우 여백 확보 */
`;

export const Sheet = styled.div`
  width: 100%;
  max-width: ${theme.maxWidth};
  max-height: 80vh;       /* 화면 중앙이므로 크기 제한 필요 */
  background: #fff;
  border-radius: ${theme.radius.xl}; /* 위아래 모두 둥글게 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const SheetHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.color.gray100};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

export const SheetTitle = styled.h3`
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.gray800};
`;

export const CloseBtn = styled.button`
  border: none;
  background: none;
  font-size: 20px;
  color: ${theme.color.gray400};
  cursor: pointer;
  line-height: 1;
`;

export const SheetBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

/* ── 내보내기 버튼 행 (마크다운 복사 / PDF) ── */
export const ExportRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid ${theme.color.gray100};
  flex-shrink: 0;
`;

export const ExportBtn = styled.button`
  flex: 1;
  height: 36px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  background: none;
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray700};
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: ${theme.color.navy};
    color: ${theme.color.navy};
  }
`;

/* ── 일지 작성 폼 ── */
export const FormRow = styled.div`
  display: flex;
  gap: 10px;
`;

export const FormLabel = styled.label`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.medium};
  color: ${theme.color.gray600};
  margin-bottom: 4px;
  display: block;
`;

export const FormInput = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray800};
  box-sizing: border-box;
  outline: none;

  &:focus {
    border-color: ${theme.color.navy};
  }
`;

export const FormGroup = styled.div`
  flex: 1;
`;

/* ── 소공정 선택 체크박스 리스트 ── */
export const ProcessSection = styled.div`
  margin-top: 4px;
`;

export const ProcessSectionTitle = styled.p`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray600};
  margin-bottom: 8px;
`;

export const MajorGroup = styled.div`
  margin-bottom: 8px;
`;

export const MajorLabel = styled.p`
  font-size: ${theme.font.size.xs};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray400};
  text-transform: uppercase;
  margin-bottom: 4px;
`;

export const CheckItem = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  cursor: pointer;
  border-bottom: 1px solid ${theme.color.gray100};

  &:last-child {
    border-bottom: none;
  }

  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: ${theme.color.navy};
    cursor: pointer;
  }

  span {
    flex: 1;
    font-size: ${theme.font.size.sm};
    color: ${theme.color.gray800};
  }
`;

export const StatusChip = styled.button`
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
  /* 버튼 위쪽으로 띄우기 (버튼 높이 고려) */
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 그림자 강화 */
  display: flex;
  flex-direction: column;
  z-index: 100; /* 표면 맨 위로 */
  overflow: hidden;
  min-width: 60px;
  animation: ${popIn} 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;

  /* 아래 꼬리(화살표) 영역 */
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
      : status === 'IN_PROGRESS' ? '#1565C0' /* 팝오버 메뉴 안에서도 파란색 */
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



/* ── 일지 상세 아이템 ── */
export const DetailItem = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid ${theme.color.gray100};
  display: flex;
  flex-direction: column;
  gap: 6px;

  &:last-child {
    border-bottom: none;
  }
`;

export const DetailItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DetailItemName = styled.span`
  flex: 1;
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.medium};
  color: ${theme.color.gray800};
`;

export const MemoPreview = styled.div`
  width: 100%;
  padding: 8px 12px;
  border-radius: ${theme.radius.sm};
  background: ${theme.color.gray50};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray700};
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

/* ── 액션 버튼 행 (일지저장 / PDF만들기 / 글복사) ── */
export const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 16px 8px;
`;

export const ActionBtn = styled.button`
  flex: 1;
  height: 44px;
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;

  /* primary(일지저장) — 남색 채움, 나머지 — 외곽선 */
  background: ${({ primary }) => (primary ? theme.color.navy : 'none')};
  color: ${({ primary }) => (primary ? '#fff' : theme.color.navy)};
  border: ${({ primary }) => (primary ? 'none' : `1.5px solid ${theme.color.navy}`)};

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:active:not(:disabled) { opacity: 0.7; }
`;

/* ── PDF 문서 미리보기 용 스타일 ── */
export const PdfPreviewBox = styled.div`
  width: 100%;
  padding: 32px;
  background: #fff;
  color: #312e2a;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  overflow-y: auto;
  border-radius: ${theme.radius.md};

  @media (max-width: 680px) {
    padding: 24px 20px;
  }
`;

export const PdfTitle = styled.h1`
  font-size: 22px;
  color: #293552;
  margin: 0 0 6px 0;
`;

export const PdfMetaLine = styled.p`
  font-size: 13px;
  color: #706c66;
  margin: 0 0 4px 0;
`;

export const PdfWeather = styled.p`
  font-size: 13px;
  color: #a8a49e;
  margin: 0 0 28px 0;
`;

export const PdfItemRow = styled.div`
  padding: 14px 0;
  border-bottom: 1px solid #f0efed;
  &:last-child {
    border-bottom: none;
  }
`;

export const PdfItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const PdfItemName = styled.span`
  font-size: 15px;
  font-weight: 600;
`;

export const PdfItemChip = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  background: ${({ status }) => {
    switch (status) {
      case 'IN_PROGRESS': return '#EBF3FF';
      case 'TOUCH_UP': return '#FFF3E0';
      case 'DONE': return '#E8F5E9';
      default: return '#f0efed';
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'IN_PROGRESS': return '#1565C0';
      case 'TOUCH_UP': return '#E65100';
      case 'DONE': return '#2E7D32';
      default: return '#706c66';
    }
  }};
`;

export const PdfItemMemoRow = styled.div`
  margin-top: 6px;
  font-size: 13px;
  color: #706c66;
  padding-left: 2px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
`;

export const PdfSectionHeader = styled.h2`
  font-size: 16px;
  color: #293552;
  margin: 28px 0 8px;
`;

export const PdfRemark = styled.p`
  font-size: 13px;
  color: #706c66;
  line-height: 1.8;
  white-space: pre-wrap;
`;

/* ── 저장 완료 알림 모달용 스타일상 ── */
export const ConfirmModal = styled.div`
  background: #fff;
  border-radius: ${theme.radius.lg};
  width: 90%;
  max-width: 340px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
`;

export const ConfirmTitle = styled.h3`
  margin: 0;
  padding: 24px 20px 12px;
  font-size: ${theme.font.size.lg};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.gray800};
  text-align: center;
`;

export const ConfirmDesc = styled.p`
  margin: 0;
  padding: 0 20px 24px;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray600};
  text-align: center;
  line-height: 1.5;
`;

export const ConfirmBtnGroup = styled.div`
  display: flex;
  border-top: 1px solid ${theme.color.gray100};
`;

export const ConfirmCancelBtn = styled.button`
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  font-size: ${theme.font.size.md};
  color: ${theme.color.gray500};
  cursor: pointer;
  border-right: 1px solid ${theme.color.gray100};

  &:last-child {
    border-right: none;
  }
  &:active {
    background: ${theme.color.gray50};
  }
`;

export const ConfirmActionBtn = styled(ConfirmCancelBtn)`
  color: ${({ primary }) => (primary ? theme.color.navy : theme.color.gray800)};
  font-weight: ${({ primary }) => (primary ? theme.font.weight.bold : theme.font.weight.medium)};
`;
