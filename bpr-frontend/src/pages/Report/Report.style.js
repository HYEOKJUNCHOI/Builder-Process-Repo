import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

export const Page = styled.div`
  min-height: 100vh;
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
  overflow: hidden;
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

export const ProcessItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid ${theme.color.gray100};

  &:last-child { border-bottom: none; }
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
  transition: border-color 0.15s;

  &:hover { border-color: ${theme.color.navy}; }
`;

export const PhotoPreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  align-items: flex-end;
  justify-content: center;
`;

export const Sheet = styled.div`
  width: 100%;
  max-width: ${theme.maxWidth};
  max-height: 85vh;
  background: #fff;
  border-radius: ${theme.radius.xl} ${theme.radius.xl} 0 0;
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

export const StatusChip = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: ${theme.radius.full};
  background: ${({ status }) => {
    switch (status) {
      case 'IN_PROGRESS': return '#EBF3FF';
      case 'TOUCH_UP':    return '#FFF3E0';
      case 'DONE':        return '#E8F5E9';
      default:            return theme.color.gray100;
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'IN_PROGRESS': return '#1565C0';
      case 'TOUCH_UP':    return '#E65100';
      case 'DONE':        return '#2E7D32';
      default:            return theme.color.gray400;
    }
  }};
`;

export const SaveBtn = styled.button`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

export const MemoInput = styled.textarea`
  width: 100%;
  min-height: 60px;
  padding: 8px 12px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray700};
  resize: vertical;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: ${theme.color.navy};
  }

  &::placeholder {
    color: ${theme.color.gray300};
  }
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
