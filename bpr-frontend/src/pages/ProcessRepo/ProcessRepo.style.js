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
`;

export const HeaderTitle = styled.h2`
  font-size: ${theme.font.size.lg};
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
`;

export const HeaderSub = styled.p`
  font-size: ${theme.font.size.xs};
  color: ${theme.color.gray400};
  margin-top: 2px;
`;

export const Content = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const TemplateCard = styled.div`
  background: #fff;
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadow.sm};
  overflow: hidden;
`;

export const TemplateHeader = styled.div`
  padding: 14px 16px;
  background: ${theme.color.navy};
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
`;

export const TemplateName = styled.span`
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  color: #fff;
`;

export const TemplateChevron = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.2s;
  display: inline-block;
`;

/* 템플릿으로 현장 만들기 CTA */
export const UseTemplateBtn = styled.button`
  display: block;
  width: calc(100% - 32px);
  margin: 10px 16px;
  height: 40px;
  border: 1.5px solid ${theme.color.navy};
  border-radius: ${theme.radius.sm};
  background: #fff;
  color: ${theme.color.navy};
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:active {
    background: ${theme.color.navy};
    color: #fff;
  }
`;

export const MajorSection = styled.div`
  border-bottom: 1px solid ${theme.color.gray100};

  &:last-child {
    border-bottom: none;
  }
`;

export const MajorRow = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: ${theme.color.gray50};
  gap: 8px;
`;

export const MajorOrder = styled.span`
  font-size: 11px;
  font-weight: ${theme.font.weight.bold};
  color: ${theme.color.navy};
  min-width: 18px;
`;

export const MajorName = styled.span`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray700};
`;

export const MinorList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const MinorItem = styled.li`
  padding: 8px 16px 8px 42px;
  border-top: 1px solid ${theme.color.gray100};
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray600};
`;

export const EmptyMsg = styled.p`
  padding: 48px 20px;
  text-align: center;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray300};
`;
