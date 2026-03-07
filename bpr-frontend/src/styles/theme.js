// BPR 디자인 토큰
// 기준 해상도: 720px (모바일 퍼스트)
// 색감 방향: 밝은 배경 + 쿨그레이 테두리 + 베이지 포인트 + 남색 텍스트

const theme = {
  color: {
    // 메인 팔레트
    navy:     '#293552',  // 딥 네이비 — 제목/활성 아이콘/버튼
    navyDark: '#1a2138',
    white:    '#FFFFFF',
    bg:       '#F8F7F4',  // 페이지 배경 — 따뜻한 오프화이트

    // 그레이 스케일 (쿨그레이 기반 — 테두리/비활성)
    gray50:   '#fafaf8',
    gray100:  '#f0efed',  // 카드 내부 구분선
    gray200:  '#d4d0ca',  // 기본 테두리
    gray300:  '#c0bbb4',  // 강조 테두리
    gray400:  '#a8a49e',  // 비활성 아이콘/텍스트
    gray500:  '#8e8a84',
    gray600:  '#706c66',
    gray700:  '#504d48',  // 보조 텍스트
    gray800:  '#312e2a',
    gray900:  '#1a1714',

    // 베이지 포인트 팔레트
    site: {
      beige:    '#d1c1b0',  // 베이지 포인트 — 버튼 테두리, 뱃지 배경 등
      tan:      '#a68b6a',  // 짙은 베이지 — 강조 포인트
      gray:     '#c5cbc4',  // 쿨 그레이 — 구분선/사이드
      deep:     '#293552',  // 딥 네이비 (=navy)
      // 이전 호환
      earth:    '#d4d0ca',  // 기본 테두리 (gray200과 동일)
      concrete: '#a8a49e',  // 비활성 (gray400과 동일)
      sand:     '#F8F7F4',  // 배경 (bg와 동일)
    },

    // 상태 컬러
    primary:   '#293552',
    purple:    '#7C3AED',
    green:     '#2E7D32',
    orange:    '#E65100',
    blue:      '#1565C0',
    danger:    '#C62828',

    // 소공정 상태별 컬러
    status: {
      WAITING:     '#a8a49e',
      IN_PROGRESS: '#1565C0',
      TOUCH_UP:    '#E65100',
      DONE:        '#2E7D32',
    },
  },

  font: {
    size: {
      xs:   '11px',
      sm:   '13px',
      md:   '15px',
      lg:   '17px',
      xl:   '20px',
      xxl:  '24px',
    },
    weight: {
      regular:  400,
      medium:   500,
      semibold: 600,
      bold:     700,
    },
  },

  radius: {
    sm:   '10px',   // 작은 버튼·배지·인풋
    md:   '16px',   // 폼 인풋·일반 버튼
    lg:   '22px',   // 카드·섹션박스
    xl:   '30px',   // 바텀시트 상단
    full: '9999px',
  },

  shadow: {
    sm: '0 1px 4px rgba(0,0,0,0.07)',
    md: '0 4px 12px rgba(0,0,0,0.10)',
    lg: '0 8px 24px rgba(0,0,0,0.14)',
  },

  maxWidth: '800px',
};

export { theme };
export default theme;
