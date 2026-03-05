import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './utils/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import useAuthStore from './store/authStore';
import TopBar from './components/layout/TopBar';

// 페이지 컴포넌트
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Checklist from './pages/Checklist/Checklist';
import Report from './pages/Report/Report';
import ProcessRepo from './pages/ProcessRepo/ProcessRepo';
import Directory from './pages/Directory/Directory';
import SeedPage from './pages/Report/SeedPage';

/**
 * 로그인 여부에 따라 접근을 제한하는 래퍼
 * - 비로그인 → /login 리다이렉트
 * - 로그인 → TopBar(고정 48px) + 콘텐츠 래퍼(padding-top:48px)
 */
function PrivateRoute({ children }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return (
    <>
      <TopBar />
      {children}
    </>
  );
}

/**
 * 이미 로그인된 상태에서 /login 접근 시 대시보드로 이동
 */
function PublicRoute({ children }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // 앱 로드 시 최초 1회 Firebase Auth 상태 동기화
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 이미 로그인된 유저면 최신 정보를 Store에 갱신
        const token = await user.getIdToken();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const name = userDoc.exists() ? userDoc.data().name : user.displayName || '이름없음';

        login({ accessToken: token, userId: user.uid, name });
      } else {
        // 로그아웃 상태면 Store 초기화
        logout();
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [login, logout]);

  if (!isAuthReady) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>인증 정보를 불러오는 중입니다...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 기본 경로 → 대시보드로 (로그인 안 돼 있으면 PrivateRoute가 /login 으로 튕김) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 1회용 DB 템플릿 시드 라우트 */}
        <Route path="/seed" element={<SeedPage />} />

        {/* 공개 라우트 */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* 인증 필요 라우트 */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/checklist"
          element={
            <PrivateRoute>
              <Checklist />
            </PrivateRoute>
          }
        />
        <Route
          path="/report"
          element={
            <PrivateRoute>
              <Report />
            </PrivateRoute>
          }
        />
        <Route
          path="/process-repo"
          element={
            <PrivateRoute>
              <ProcessRepo />
            </PrivateRoute>
          }
        />
        <Route
          path="/directory"
          element={
            <PrivateRoute>
              <Directory />
            </PrivateRoute>
          }
        />

        {/* 없는 경로 → 대시보드로 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
