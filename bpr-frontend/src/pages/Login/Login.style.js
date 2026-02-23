import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 0 24px;
  background-color: ${theme.color.bg};
`;

export const Logo = styled.div`
  margin-bottom: 40px;
  text-align: center;

  h1 {
    font-size: ${theme.font.size.xxl};
    font-weight: ${theme.font.weight.bold};
    color: ${theme.color.navy};
    letter-spacing: -0.5px;
  }

  p {
    margin-top: 6px;
    font-size: ${theme.font.size.sm};
    color: ${theme.color.gray400};
  }
`;

export const Form = styled.form`
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Label = styled.label`
  font-size: ${theme.font.size.sm};
  font-weight: ${theme.font.weight.medium};
  color: ${theme.color.gray600};
`;

export const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1.5px solid ${theme.color.gray200};
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.size.md};
  color: ${theme.color.gray800};
  background: #fff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${theme.color.navy};
  }

  &::placeholder {
    color: ${theme.color.gray300};
  }
`;

export const SubmitButton = styled.button`
  margin-top: 8px;
  width: 100%;
  height: 52px;
  border: none;
  border-radius: ${theme.radius.md};
  background-color: ${theme.color.navy};
  color: #fff;
  font-size: ${theme.font.size.md};
  font-weight: ${theme.font.weight.semibold};
  cursor: pointer;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ToggleText = styled.p`
  margin-top: 16px;
  text-align: center;
  font-size: ${theme.font.size.sm};
  color: ${theme.color.gray400};

  span {
    color: ${theme.color.navy};
    font-weight: ${theme.font.weight.medium};
    cursor: pointer;
    text-decoration: underline;
  }
`;

export const ErrorMsg = styled.p`
  font-size: ${theme.font.size.sm};
  color: ${theme.color.danger};
  text-align: center;
  margin-top: -4px;
`;
