import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useLangStore from '../../store/langStore';
import useT from '../../i18n/useT';
import * as S from './TopBar.style';

/**
 * 앱 상단 바
 * - 왼쪽: 인사말+사용자명 (언어에 따라 한/일 전환)
 * - 오른쪽: 언어 토글 + 로그아웃 버튼
 */
export default function TopBar() {
  const navigate = useNavigate();
  const { name: userName, logout } = useAuthStore();
  const { lang, setLang } = useLangStore();
  const { t } = useT();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLang = () => {
    setLang(lang === 'ko' ? 'ja' : 'ko');
  };

  return (
    <S.Bar data-qa="topbar">
      <S.Greeting data-qa="topbar-greeting">{t.greeting(userName)}</S.Greeting>
      <S.RightGroup>
        <S.LangBtn data-qa="topbar-lang-toggle" onClick={toggleLang}>
          {lang === 'ko' ? '日本語' : '한국어'}
        </S.LangBtn>
        <S.LogoutBtn data-qa="topbar-logout" onClick={handleLogout}>{t.logout}</S.LogoutBtn>
      </S.RightGroup>
    </S.Bar>
  );
}
