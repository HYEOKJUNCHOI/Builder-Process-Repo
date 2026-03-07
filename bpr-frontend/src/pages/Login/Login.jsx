import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { login, register, findEmailByName, resetPassword } from './Login.api';
import * as S from './Login.style';

/**
 * 로그인 / 회원가입 / 아이디 찾기 / 비밀번호 찾기 통합 페이지
 */
export default function Login() {
  const navigate = useNavigate();
  const storeLogin = useAuthStore((s) => s.login);

  // 'login' | 'register' | 'findId' | 'findPw'
  const [viewMode, setViewMode] = useState('login');

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const changeMode = (mode) => {
    setViewMode(mode);
    clearMessages();
    // 폼 초기화 (선택적 요소지만 UX상 깔끔하게 비워줌)
    if (mode === 'login' || mode === 'register') {
      setPassword('');
    }
    if (mode === 'findId') {
      setName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (viewMode === 'register') {
        if (!name.trim()) {
          setError('이름을 입력해주세요.');
          setLoading(false);
          return;
        }
        const data = await register(loginId, password, name);
        storeLogin({ accessToken: data.accessToken, userId: data.userId, name: data.name });
        navigate('/dashboard');

      } else if (viewMode === 'login') {
        const data = await login(loginId, password);
        storeLogin({ accessToken: data.accessToken, userId: data.userId, name: data.name });
        navigate('/dashboard');

      } else if (viewMode === 'findId') {
        if (!name.trim()) {
          setError('가입 시 등록한 이름을 입력해주세요.');
          setLoading(false);
          return;
        }
        const foundEmail = await findEmailByName(name);
        setSuccessMsg(`회원님의 아이디는 [ ${foundEmail} ] 입니다.`);

      } else if (viewMode === 'findPw') {
        if (!loginId.trim()) {
          setError('가입 시 등록한 아이디(이메일)를 입력해주세요.');
          setLoading(false);
          return;
        }
        await resetPassword(loginId);
        setSuccessMsg('비밀번호 재설정 링크가 이메일로 발송되었습니다. 메일함을 확인해주세요.');
      }
    } catch (err) {
      // 서버에서 내려오는 에러 메시지 처리
      const msg = err.message || err.response?.data?.message || err.response?.data || '요청 처리 중 오류가 발생했습니다.';
      setError(String(msg));

      // 파이어베이스 기본 에러메시지 한글화 매핑 (옵션)
      if (err.code === 'auth/invalid-credential') {
        setError('아이디 또는 비밀번호를 다시 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.Container>
      <S.Logo>
        <h1>BPR</h1>
        <p>현장 공정 관리 시스템</p>
      </S.Logo>

      <S.Form onSubmit={handleSubmit}>
        {/* === 아이디(이메일) 입력칸 (아이디 찾기 모드 제외) === */}
        {viewMode !== 'findId' && (
          <S.InputGroup>
            <S.Label htmlFor="loginId">아이디 (이메일)</S.Label>
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
        )}

        {/* === 비밀번호 입력칸 (로그인, 회원가입 모드) === */}
        {(viewMode === 'login' || viewMode === 'register') && (
          <S.InputGroup>
            <S.Label htmlFor="password">비밀번호</S.Label>
            <S.Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={viewMode === 'register' ? 'new-password' : 'current-password'}
            />
          </S.InputGroup>
        )}

        {/* === 이름 입력칸 (회원가입, 아이디 찾기 모드) === */}
        {(viewMode === 'register' || viewMode === 'findId') && (
          <S.InputGroup>
            <S.Label htmlFor="name">이름 (실명)</S.Label>
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

        {/* 메시지 영역 */}
        {error && <S.ErrorMsg>{error}</S.ErrorMsg>}
        {successMsg && <S.SuccessMsg>{successMsg}</S.SuccessMsg>}

        {/* 제출 버튼 */}
        <S.SubmitButton type="submit" disabled={loading}>
          {loading ? '처리 중...' :
            viewMode === 'login' ? '로그인' :
              viewMode === 'register' ? '회원가입' :
                viewMode === 'findId' ? '아이디 찾기' : '비밀번호 재설정'}
        </S.SubmitButton>
      </S.Form>

      {/* 서브 링크 영역 (아이디 찾기 | 비밀번호 찾기) */}
      {viewMode === 'login' && (
        <S.SubLinks>
          <span onClick={() => changeMode('findId')}>아이디 찾기</span>
          <span className="divider">|</span>
          <span onClick={() => changeMode('findPw')}>비밀번호 찾기</span>
        </S.SubLinks>
      )}

      {/* 하단 토글 로그인/회원가입/돌아가기 */}
      <S.ToggleText>
        {viewMode === 'login' ? (
          <>계정이 없으신가요? <span onClick={() => changeMode('register')}>회원가입</span></>
        ) : viewMode === 'register' ? (
          <>이미 계정이 있으신가요? <span onClick={() => changeMode('login')}>로그인</span></>
        ) : (
          <span onClick={() => changeMode('login')}>로그인 화면으로 돌아가기</span>
        )}
      </S.ToggleText>
    </S.Container>
  );
}
