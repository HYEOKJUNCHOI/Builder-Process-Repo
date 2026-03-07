import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import * as S from './TopBar.style';

/**
 * 앱 상단 바
 * - 왼쪽: 인사말+사용자명
 * - 오른쪽: 로그아웃 버튼
 */
export default function TopBar() {
  const navigate = useNavigate();
  const { name: userName, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <S.Bar data-qa="topbar">
      <S.Greeting data-qa="topbar-greeting">안녕하세요, {userName}님</S.Greeting>
      <S.LogoutBtn data-qa="topbar-logout" onClick={handleLogout}>로그아웃</S.LogoutBtn>
    </S.Bar>
  );
}
