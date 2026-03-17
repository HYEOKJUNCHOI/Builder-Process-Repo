import { create } from 'zustand';

/**
 * 언어 선택 전역 상태 (웹)
 * — localStorage로 선택 언어를 영구 저장
 * — 앱 시작 시 저장된 값 복원
 */
const useLangStore = create((set) => ({
  lang: localStorage.getItem('bpr_lang') ?? 'ko',
  setLang: (lang) => {
    localStorage.setItem('bpr_lang', lang);
    set({ lang });
  },
}));

export default useLangStore;
