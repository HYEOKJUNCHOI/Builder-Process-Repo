import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { login, register } from './Login.api';
import * as S from './Login.style';

/**
 * 로그인 / 회원가입 통합 페이지
 * - isRegister 상태로 두 폼을 토글
 * - 성공 시 Zustand 스토어에 토큰 저장 → /dashboard 이동
 */
export default function Login() {
  const navigate = useNavigate();
  const storeLogin = useAuthStore((s) => s.login);

  const [isRegister, setIsRegister] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        if (!name.trim()) {
          setError('이름을 입력해주세요.');
          return;
        }
        data = await register(loginId, password, name);
      } else {
        data = await login(loginId, password);
      }

      // 토큰·유저 정보 Zustand 저장 — login()은 객체 하나를 받음
      storeLogin({ accessToken: data.accessToken, userId: data.userId, name: data.name });
      navigate('/dashboard');
    } catch (err) {
      // 서버에서 내려오는 에러 메시지 우선, 없으면 기본 문구
      const msg = err.response?.data?.message || err.response?.data || '아이디 또는 비밀번호를 확인해주세요.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setError('');
  };

  return (
    <S.Container>
      <S.Logo>
        <h1>BPR</h1>
        <p>현장 공정 관리 시스템</p>
      </S.Logo>

      <S.Form onSubmit={handleSubmit}>
        <S.InputGroup>
          <S.Label htmlFor="loginId">아이디</S.Label>
          <S.Input
            id="loginId"
            type="text"
            placeholder="아이디를 입력하세요"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
            autoComplete="username"
          />
        </S.InputGroup>

        <S.InputGroup>
          <S.Label htmlFor="password">비밀번호</S.Label>
          <S.Input
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </S.InputGroup>

        {/* 회원가입 시에만 이름 필드 표시 */}
        {isRegister && (
          <S.InputGroup>
            <S.Label htmlFor="name">이름</S.Label>
            <S.Input
              id="name"
              type="text"
              placeholder="실명을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </S.InputGroup>
        )}

        {error && <S.ErrorMsg>{error}</S.ErrorMsg>}

        <S.SubmitButton type="submit" disabled={loading}>
          {loading ? '처리 중...' : isRegister ? '회원가입' : '로그인'}
        </S.SubmitButton>
      </S.Form>

      <S.ToggleText>
        {isRegister ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
        <span onClick={toggleMode}>{isRegister ? '로그인' : '회원가입'}</span>
      </S.ToggleText>
    </S.Container>
  );
}
