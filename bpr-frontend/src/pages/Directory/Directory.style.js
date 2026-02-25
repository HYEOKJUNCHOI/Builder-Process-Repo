import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

export const Page = styled.div`
  min-height: 100vh;
  padding-bottom: 72px; /* BottomNav 영역 확보 */
  background: ${theme.color.bg};
`;

export const Header = styled.header`
  position: sticky;
  top: 52px; /* TopBar 바로 아래 */
  z-index: 10;
  background: #fff;
  box-shadow: 0 2px 6px rgba(41, 53, 82, 0.07);
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const HeaderTitle = styled.h2`
  font-size: ${theme.font.size.xl};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  margin: 0;
`;

export const SubTitle = styled.p`
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray500};
  margin: 0;
  font-weight: ${theme.font.weight.medium};
`;

export const ListContainer = styled.ul`
  list-style: none;
  padding: 16px 20px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ListItem = styled.li`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 16px;
  border-radius: ${theme.radius.xl};
  box-shadow: ${theme.shadow.sm};
  gap: 16px;
`;

export const ProfileThumb = styled.div`
  width: 50px;
  height: 50px;
  border-radius: ${theme.radius.full};
  background: ${theme.color.gray200};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.color.gray500};
  font-size: 24px;
`;

export const InfoArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
`;

export const InfoTopRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

export const Name = styled.strong`
  font-size: ${theme.font.size.lg};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.gray800};
`;

export const Specialty = styled.span`
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray500};
`;

export const Description = styled.p`
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray600};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ActionArea = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${theme.radius.full};
  border: none;
  background: ${theme.color.gray100};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: ${theme.color.navy};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${theme.color.gray200};
  }
`;

/* ── 모달 (상세 정보 팝업) ── */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Modal = styled.div`
  width: 90%;
  max-width: 320px;
  background: #fff;
  border-radius: ${theme.radius.xl};
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

export const ModalTitle = styled.h3`
  font-size: ${theme.font.size.lg};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.gray800};
  margin: 0;
`;

export const ModalText = styled.p`
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray600};
  text-align: center;
  line-height: 1.5;
  margin: 0;
`;

export const ModalCloseBtn = styled.button`
  width: 100%;
  height: 44px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  margin-top: 8px;
`;
