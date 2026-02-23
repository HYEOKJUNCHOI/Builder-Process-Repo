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
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont,
      'Segoe UI', sans-serif;
    font-size: 15px;
    color: #312e2a;            /* 다크 텍스트 */
    background-color: #dddbd6; /* 바깥 여백 — 쿨 그레이 */
    -webkit-font-smoothing: antialiased;
  }

  #root {
    height: 100%;
    max-width: 800px;
    margin: 0 auto;
    background-color: #f5f4f1; /* 앱 배경 — 밝고 따뜻한 아이보리 화이트 */
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
