import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/* 카드 전체 — hover 시 삭제 버튼 노출 */
export const Card = styled.div`
  border-radius: ${theme.radius.lg};
  overflow: hidden;
  box-shadow: ${theme.shadow.md};
  cursor: pointer;
  background: #fff;
  border: 1px solid ${theme.color.gray200};
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;

  &:hover > div:first-of-type > button {
    opacity: 1;
  }

  &:active {
    transform: scale(0.97);
    box-shadow: ${theme.shadow.sm};
  }
`;

/* 상단 70% — 그라디언트 이미지 영역 */
export const ImageArea = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: ${({ gradient }) => gradient};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

/* 배경 SVG 아이콘 (워터마크처럼) */
export const IconWrap = styled.div`
  width: 72%;
  height: 72%;
  opacity: 0.9;

  svg {
    width: 100%;
    height: 100%;
  }
`;

/* 진행률 오버레이 바 (하단) */
export const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ progress }) => progress}%;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 0 2px 2px 0;
    transition: width 0.3s;
  }
`;

/* 호버 시 나타나는 삭제 버튼 (오른쪽 상단) */
export const DeleteBtn = styled.button`
  position: absolute;
  top: 7px;
  right: 7px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 13px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;                      /* 기본: 숨김 */
  transition: opacity 0.18s, background 0.15s;
  backdrop-filter: blur(4px);
  z-index: 2;

  &:hover {
    background: rgba(198, 40, 40, 0.85);  /* 호버 시 빨간색 */
  }
`;

/* 하단 30% — 텍스트 영역 */
export const TextArea = styled.div`
  padding: 10px 12px 12px;
  background: #fff;
`;

export const ProcessName = styled.p`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.gray800};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SubInfo = styled.p`
  margin-top: 3px;
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray400};
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const StatusDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ color }) => color ?? '#ccc'};
  flex-shrink: 0;
`;
