import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import TopBar from './components/layout/TopBar';

// 페이지 컴포넌트
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Checklist from './pages/Checklist/Checklist';
import Report from './pages/Report/Report';
import ProcessRepo from './pages/ProcessRepo/ProcessRepo';

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
      {/* TopBar(fixed 52px) 높이만큼 패딩 확보 */}
      <div style={{ paddingTop: '52px' }}>
        {children}
      </div>
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
  return (
    <BrowserRouter>
      <Routes>
        {/* 기본 경로 → 대시보드로 (로그인 안 돼 있으면 PrivateRoute가 /login 으로 튕김) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

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

        {/* 없는 경로 → 대시보드로 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
