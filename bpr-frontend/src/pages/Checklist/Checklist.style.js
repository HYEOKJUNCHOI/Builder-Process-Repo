import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

export const Page = styled.div`
  min-height: 100vh;
  padding-bottom: 72px;
  background: ${theme.color.bg};
`;

/* ── 3단 분할 레이아웃 적용 (최소 침해 원칙 / [앵커 불변]) ── */
export const LeftSidebarWrapper = styled.div`
  position: fixed;
  /* 가운데 720px 컨텐츠 기준 왼쪽 여백 공간에 배치 */
  left: calc(50% - 360px - 220px); 
  margin-left: -40px;
  top: 132px;
  width: 200px;
  background: #fff;
  border-radius: ${theme.radius.xl};
  box-shadow: ${theme.shadow.sm};
  border: 1px solid ${theme.color.gray200};
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 5;

  @media (max-width: 1200px) {
    display: none;
  }
`;

export const RightSidebarWrapper = styled.aside`
  position: fixed;
  /* 가운데 720px 컨텐츠 기준 오른쪽 여백 공간 간격 조정 (-50px) */
  left: calc(50% + 360px + 74px);
  margin-left: -15px;
  /* 좀 더 아래쪽으로 깔아주기 위해 top 증가 */
  top: 232px;
  width: 300px;
  background: #fff;
  border-radius: ${theme.radius.xl};
  box-shadow: ${theme.shadow.sm};
  border: 1px solid ${theme.color.gray200};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 5;

  @media (max-width: 1350px) {
    display: none;
  }
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
  font-size: ${theme.font.size.md};
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
  height: 44px;
  padding: 0 12px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  outline: none;
  font-size: ${theme.font.size.md};
  color: ${theme.color.gray800};
  &:focus { border-color: ${theme.color.navy}; }
`;

export const GlobalAddTextarea = styled.textarea`
  width: 100%;
  height: 80px;
  padding: 12px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  outline: none;
  font-size: ${theme.font.size.md};
  color: ${theme.color.gray800};
  resize: vertical;
  &:focus { border-color: ${theme.color.navy}; }
`;

export const GlobalAddModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
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
  z-index: 10;
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
`;

export const MajorHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 20px 8px;
`;

export const MajorTitle = styled.h2`
  font-size: ${theme.font.size.xxl};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  margin: 0;
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
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

export const Sheet = styled.div`
  width: 100%;
  max-width: ${theme.maxWidth};
  max-height: 80vh;
  background: #fff;
  border-radius: ${theme.radius.xl} ${theme.radius.xl} 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  min-width: 56px;
  padding: 4px 8px;
  border-radius: ${theme.radius.full};
  font-size: 11px;
  font-weight: ${theme.font.weight.semibold};
  border: none;
  cursor: pointer;

  background: ${({ status }) => {
    switch (status) {
      case 'IN_PROGRESS': return '#EBF3FF';
      case 'TOUCH_UP': return '#FFF3E0';
      case 'DONE': return '#E8F5E9';
      default: return theme.color.gray100;
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'IN_PROGRESS': return '#1565C0';
      case 'TOUCH_UP': return '#E65100';
      case 'DONE': return '#2E7D32';
      default: return theme.color.gray500;
    }
  }};

  &:active { opacity: 0.7; }
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

/* 메모 토글 버튼 (✎) */
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
  align-items: flex-end;
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

export const MemoSaveBtn = styled.button`
  height: 34px;
  padding: 0 12px;
  border: none;
  border-radius: ${theme.radius.sm};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.xs};
  cursor: pointer;
  flex-shrink: 0;
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
  padding: 0 14px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray800};
  background: #fff;
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
