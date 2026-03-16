import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/* 커스텀 드롭다운 컴포넌트 스타일
 * 네이티브 <select>는 options popup 라운드를 CSS로 제어 불가 → 직접 구현 */

export const Container = styled.div`
  position: relative;
  width: 100%;
`;

/* 닫힌 상태의 트리거 버튼 */
export const Trigger = styled.button`
  width: 100%;
  height: 44px;
  padding: 0 36px 0 14px; /* 오른쪽 화살표 공간 확보 */
  border: 1.5px solid ${({ isOpen }) => (isOpen ? theme.color.navy : theme.color.gray200)};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray800};
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-align: left;
  position: relative;
  transition: border-color 0.15s;
  outline: none;

  &:hover {
    border-color: ${theme.color.gray300};
  }
`;

/* 선택된 값 텍스트 — 넘치면 말줄임표 */
export const TriggerLabel = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* 화살표 아이콘 — 오픈 시 180도 회전 */
export const Arrow = styled.span`
  position: absolute;
  right: 20px; /* 오른쪽에서 20px 안쪽 */
  top: 50%;
  transform: translateY(-50%) ${({ isOpen }) => (isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s;
  width: 12px;
  height: 8px;
  display: block;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
`;

/* 열린 드롭다운 목록 — 라운드 + 그림자 */
export const DropdownList = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 200; /* 사이드바(5)보다 훨씬 높게 — 다른 요소에 가리지 않도록 */
  background: #fff;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.lg}; /* 22px — 라운드 있는 팝업 */
  box-shadow: ${theme.shadow.md};
  list-style: none;
  padding: 6px;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

/* 개별 옵션 아이템 */
export const DropdownItem = styled.li`
  padding: 10px 12px;
  border-radius: ${theme.radius.sm}; /* 10px — 항목 자체도 라운드 */
  font-size: ${theme.font.size.sm};
  color: ${({ active }) => (active ? theme.color.navy : theme.color.gray700)};
  background: ${({ active }) => (active ? theme.color.bg : 'transparent')};
  font-weight: ${({ active }) => (active ? theme.font.weight.bold : theme.font.weight.regular)};
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: ${theme.color.gray100};
  }
`;
