import useLangStore from '../store/langStore';
import strings from './strings';

/**
 * 다국어 훅 — 현재 언어에 맞는 문자열 객체 반환
 * 사용법: const { t, lang } = useT();
 */
export default function useT() {
  const { lang } = useLangStore();
  const t = strings[lang] ?? strings.ko;
  return { t, lang };
}
