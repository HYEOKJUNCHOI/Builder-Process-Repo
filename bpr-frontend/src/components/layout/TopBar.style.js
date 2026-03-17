import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/* 상단 바 — 남색 배경 (스크롤 시 화면 최상단에 고정) */
export const Bar = styled.header`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 680px; /* 기존 800px의 85% */
  height: 52px;
  background: ${theme.color.navy};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 20; /* 전체 페이지에서 가장 높은 위치에 고정 */
`;

export const Greeting = styled.span`
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
`;


/* 인사말과 로그아웃 사이 날짜·요일 — 가로 한 줄 배치 */
export const DateInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const DateInfoDate = styled.span`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.bold};
  color: #fff;
`;

export const DateInfoDay = styled.span`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.medium};
  color: rgba(255, 255, 255, 0.55);
`;

export const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const LogoutBtn = styled.button`
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  background: none;
  padding: 4px 10px;
  border-radius: ${theme.radius.sm};
  font-size: ${theme.font.size.xs};
  font-weight: ${theme.font.weight.medium};
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  white-space: nowrap;

  &:hover { background: rgba(255, 255, 255, 0.1); }
  &:active { opacity: 0.7; }
`;

/* 언어 토글 버튼 — navy 배경 위에서 눈에 띄도록 흰색 배경 + navy 텍스트 */
export const LangBtn = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.92);
  padding: 4px 10px;
  border-radius: ${theme.radius.sm};
  font-size: ${theme.font.size.xs};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  cursor: pointer;
  white-space: nowrap;

  &:hover { background: #fff; }
  &:active { opacity: 0.7; }
`;
