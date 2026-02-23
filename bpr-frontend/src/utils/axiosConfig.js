import axios from 'axios';

// 백엔드 기본 URL — Vite proxy를 통해 /api 요청을 8080으로 전달
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 템플릿 복사(대공정+소공정 대량 INSERT) 여유 시간 확보
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 — localStorage에서 토큰을 꺼내 Authorization 헤더에 자동 삽입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 — 401이면 토큰 만료로 판단, 로그인 페이지로 이동
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
