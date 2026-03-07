import { Global, css } from '@emotion/react';

// 전역 스타일 — 폰트, 리셋, 기본 박스모델
const globalStyles = css`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    /* zoom: 0.85; (제거됨: 네이티브 스크롤 계산 버그 유발로 인해 전체 레이아웃 리스케일링 적용) */
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont,
      'Segoe UI', sans-serif;
    font-size: 13px; /* 15px의 86.6%, 전체적인 텍스트 크기 85% 감각에 맞춤 */
    color: #312e2a;            /* 다크 텍스트 */
    background-color: #dddbd6; /* 바깥 여백 — 쿨 그레이 */
    -webkit-font-smoothing: antialiased;
  }

  #root {
    height: 100%;
    /* 800px * 0.85 = 680px */
    max-width: 680px;
    margin: 0 auto;
    background-color: #F8F7F4; /* 앱 배경 — 따뜻한 오프화이트 */
    position: relative;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
  }

  input, textarea {
    font-family: inherit;
    outline: none;
  }

  ul, ol {
    list-style: none;
  }
`;

const GlobalStyle = () => <Global styles={globalStyles} />;

export default GlobalStyle;
