import { create } from 'zustand';
import { auth } from '../utils/firebaseConfig';
import { signOut } from 'firebase/auth';

// 인증 상태 관리 (Zustand)
// accessToken, userId, name을 전역으로 관리
const useAuthStore = create((set) => ({
  accessToken: localStorage.getItem('accessToken') || null,
  userId: localStorage.getItem('userId') || null,
  name: localStorage.getItem('name') || null,

  // 로그인 성공 시 호출
  login: ({ accessToken, userId, name }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userId', String(userId));
    localStorage.setItem('name', name);
    set({ accessToken, userId, name });
  },

  // 로그아웃
  logout: async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase Auth SignOut Error:', err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    set({ accessToken: null, userId: null, name: null });
  },

  isLoggedIn: () => !!localStorage.getItem('accessToken'),
}));

export default useAuthStore;
