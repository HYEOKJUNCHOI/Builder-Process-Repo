import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/* 상단 고정 바 — 남색 배경 */
export const Bar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  z-index: 50;
  background: ${theme.color.navy};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  /* 최대 너비 중앙 정렬 */
  max-width: ${theme.maxWidth};
  margin: 0 auto;
`;

export const Greeting = styled.span`
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
`;


export const LogoutBtn = styled.button`
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  background: none;
  padding: 5px 12px;
  border-radius: ${theme.radius.sm};
  font-size: ${theme.font.size.xs};
  font-weight: ${theme.font.weight.semibold};
  color: #fff;
  cursor: pointer;
  white-space: nowrap;

  &:active { opacity: 0.7; }
`;
