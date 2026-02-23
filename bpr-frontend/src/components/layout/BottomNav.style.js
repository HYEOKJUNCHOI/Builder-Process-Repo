import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/* 하단 고정 네비게이션 — TopBar처럼 바닥에 붙이고 배경과 통일 */
export const Nav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: ${theme.color.bg}; /* 페이지 배경색과 동일하게 녹아듦 */
  border-top: 1px dashed ${theme.color.gray300}; /* TopBar 스타일과 대칭 */
  display: flex;
  align-items: center;
  z-index: 100;

  /* 최대 너비 중앙 정렬 */
  max-width: ${theme.maxWidth};
  margin: 0 auto;
`;

export const Tab = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  /* 활성: 딥 네이비 / 비활성: 쿨 그레이 */
  color: ${({ active }) => (active ? theme.color.navy : theme.color.gray400)};
  transition: color 0.15s;

  svg {
    width: 22px;
    height: 22px;
  }

  span {
    font-size: 10px;
    font-weight: ${({ active }) => (active ? theme.font.weight.semibold : theme.font.weight.regular)};
  }
`;
