import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/* ── 레이아웃 ── */
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
  justify-content: space-between;
  gap: 10px;
`;

/* 날짜·날씨 묶음 — 헤더 왼쪽 */
export const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
`;

export const LogoutBtn = styled.button`
  border: 1.5px solid ${theme.color.navy};
  background: none;
  padding: 6px 14px;
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.xs};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.navy};
  cursor: pointer;

  &:active { opacity: 0.7; }
`;

export const Content = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/* ── 현장 선택 ── */
export const SectionLabel = styled.p`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray600};
  margin-bottom: 8px;
`;

export const ProjectSelect = styled.select`
  height: 38px;
  padding: 0 10px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray700};
  background: #fff;
  cursor: pointer;
  outline: none;
  flex: 1;
  min-width: 0;

  &:focus {
    border-color: ${theme.color.navy};
  }
`;

/* 현장명 + 주소 묶음 */
export const ProjectInfo = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/* 현장명 — 굵고 크게 */
export const ProjectName = styled.p`
  font-size: ${theme.font.size.xl};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  line-height: 1.2;
`;

/* 현장 주소 — 현장명 아래 서브텍스트 */
export const ProjectAddress = styled.p`
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray500};
`;

/* ── 날짜·날씨 배너 ── */
export const DateWeatherRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadow.sm};
  border: 1px solid ${theme.color.gray200};
`;

export const DateText = styled.span`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.navy};
`;

export const WeatherText = styled.span`
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray600};
`;

/* ── 공정 통계 카드 그리드 (진척도/진행도/공정편차 3열) ── */
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

export const StatCard = styled.div`
  background: #fff;
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadow.sm};
  border: 1px solid ${theme.color.gray200};
  padding: 14px 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

/* SVG 링과 중앙 텍스트를 겹쳐 표시하는 래퍼 */
export const StatRingWrap = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* SVG 링 위에 겹쳐지는 숫자/아이콘 레이블 */
export const StatRingLabel = styled.span`
  position: absolute;
  font-size: 13px;
  font-weight: ${theme.font.weight.bold};
  line-height: 1;
  color: ${({ deviation }) =>
    deviation === undefined
      ? theme.color.navy
      : deviation <= 0
      ? '#2E7D32'
      : '#C62828'};
`;

export const StatName = styled.p`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray800};
  text-align: center;
`;

export const StatDesc = styled.p`
  font-size: 10px;
  color: ${theme.color.gray400};
  text-align: center;
`;

/* 📝 일지 작성 이동 버튼 */
export const TaskReportBtn = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.15s;

  &:hover { opacity: 1; }
`;

/* 현장 없을 때 체크리스트로 이동 버튼 */
export const GoChecklistBtn = styled.button`
  display: block;
  margin: 0 16px 20px;
  width: calc(100% - 32px);
  height: 44px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
`;

/* ── 오늘 할 일 ── */
export const SectionBox = styled.div`
  background: #fff;
  border-radius: ${theme.radius.lg};
  overflow: hidden;
  box-shadow: ${theme.shadow.sm};
  border: 1px solid ${theme.color.gray200};
`;

export const SectionHead = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid ${theme.color.gray100};
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: ${theme.font.size.md};
    font-weight: ${theme.font.weight.semibold};
    color: ${theme.color.gray800};
  }

  span {
    font-size: ${theme.font.size.xs};
    color: ${theme.color.gray400};
  }
`;

export const TaskList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const TaskItem = styled.li`
  padding: 10px 16px;
  border-bottom: 1px solid ${theme.color.gray100};
  display: flex;
  flex-direction: column;

  &:last-child {
    border-bottom: none;
  }
`;

/* 상단 한 줄 (상태·이름·대공정·★) */
export const TaskRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

/* 메모 미리보기 텍스트 */
export const TaskMemoPreview = styled.p`
  margin-top: 4px;
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray400};
  padding-left: 62px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* 메모 토글 버튼 (✎) */
export const TaskMemoToggleBtn = styled.button`
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

/* 메모 편집 영역 */
export const TaskMemoArea = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-top: 8px;
`;

export const TaskMemoTextarea = styled.textarea`
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

export const TaskMemoSaveBtn = styled.button`
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

export const StatusBadge = styled.span`
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: ${theme.radius.full};
  font-size: 11px;
  font-weight: ${theme.font.weight.semibold};
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

export const TaskName = styled.span`
  flex: 1;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray800};
`;

export const MajorLabel = styled.span`
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray400};
`;

/* 상태 순환 버튼 — StatusBadge와 동일한 비주얼이지만 button 태그 */
export const TaskStatusBtn = styled.button`
  flex-shrink: 0;
  min-width: 52px;
  padding: 2px 8px;
  border-radius: ${theme.radius.full};
  font-size: 11px;
  font-weight: ${theme.font.weight.semibold};
  border: none;
  cursor: pointer;

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

  &:active { opacity: 0.7; }
`;

/* ★ 오늘 할 일 토글 버튼 */
export const TaskTodayBtn = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 2px;
  color: ${({ active }) => (active ? '#FFB300' : theme.color.gray200)};
  transition: color 0.15s;
`;

export const EmptyMsg = styled.p`
  padding: 32px 16px;
  text-align: center;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray300};
  white-space: pre-line;
`;
