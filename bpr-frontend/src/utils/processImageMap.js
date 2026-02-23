/**
 * 대공정 이름 키워드 → 카드 테마(그라디언트 + 아이콘 SVG) 자동 매핑
 * 매칭 안 되면 DEFAULT 테마 사용
 */

const PROCESS_THEMES = [
  {
    keywords: ['가설'],
    gradient: 'linear-gradient(145deg, #FF8C42 0%, #FF6B35 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="6" height="40" rx="2" fill="rgba(255,255,255,0.9)"/>
      <rect x="50" y="12" width="6" height="40" rx="2" fill="rgba(255,255,255,0.9)"/>
      <rect x="8" y="20" width="48" height="4" rx="2" fill="rgba(255,255,255,0.7)"/>
      <rect x="8" y="34" width="48" height="4" rx="2" fill="rgba(255,255,255,0.7)"/>
      <rect x="8" y="48" width="48" height="4" rx="2" fill="rgba(255,255,255,0.7)"/>
    </svg>`,
    label: '가설공사',
  },
  {
    keywords: ['토공', '굴착', '부지'],
    gradient: 'linear-gradient(145deg, #A0522D 0%, #8B4513 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 48 Q20 28 32 32 Q44 36 56 16" stroke="rgba(255,255,255,0.9)" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M8 56 L56 56 L52 44 Q44 48 32 44 Q20 40 8 48 Z" fill="rgba(255,255,255,0.4)"/>
      <circle cx="44" cy="28" r="8" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.8)" stroke-width="2"/>
      <path d="M40 28 L48 28 M44 24 L44 32" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    label: '토공사',
  },
  {
    keywords: ['기초'],
    gradient: 'linear-gradient(145deg, #607D8B 0%, #455A64 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="40" width="40" height="12" rx="2" fill="rgba(255,255,255,0.9)"/>
      <rect x="20" y="28" width="24" height="14" rx="1" fill="rgba(255,255,255,0.7)"/>
      <rect x="26" y="16" width="12" height="14" rx="1" fill="rgba(255,255,255,0.5)"/>
      <line x1="8" y1="52" x2="56" y2="52" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-dasharray="4 3"/>
    </svg>`,
    label: '기초공사',
  },
  {
    keywords: ['철골', '철근', '구조'],
    gradient: 'linear-gradient(145deg, #37474F 0%, #1C313A 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="16" y1="8" x2="16" y2="56" stroke="rgba(255,255,255,0.9)" stroke-width="5" stroke-linecap="round"/>
      <line x1="48" y1="8" x2="48" y2="56" stroke="rgba(255,255,255,0.9)" stroke-width="5" stroke-linecap="round"/>
      <line x1="16" y1="20" x2="48" y2="20" stroke="rgba(255,255,255,0.7)" stroke-width="3" stroke-linecap="round"/>
      <line x1="16" y1="32" x2="48" y2="32" stroke="rgba(255,255,255,0.7)" stroke-width="3" stroke-linecap="round"/>
      <line x1="16" y1="44" x2="48" y2="44" stroke="rgba(255,255,255,0.7)" stroke-width="3" stroke-linecap="round"/>
      <line x1="16" y1="8" x2="48" y2="20" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <line x1="16" y1="20" x2="48" y2="32" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <line x1="16" y1="32" x2="48" y2="44" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    </svg>`,
    label: '철골공사',
  },
  {
    keywords: ['지붕', '외벽'],
    gradient: 'linear-gradient(145deg, #C0392B 0%, #922B21 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 32 L32 10 L56 32" stroke="rgba(255,255,255,0.9)" stroke-width="4" stroke-linejoin="round" fill="rgba(255,255,255,0.15)"/>
      <rect x="16" y="32" width="32" height="22" fill="rgba(255,255,255,0.3)" rx="1"/>
      <rect x="26" y="40" width="12" height="14" fill="rgba(255,255,255,0.6)" rx="1"/>
    </svg>`,
    label: '지붕·외벽공사',
  },
  {
    keywords: ['바닥', '마루', '타일'],
    gradient: 'linear-gradient(145deg, #795548 0%, #5D4037 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="28" width="48" height="4" rx="1" fill="rgba(255,255,255,0.9)"/>
      <rect x="8" y="36" width="22" height="20" rx="1" fill="rgba(255,255,255,0.5)"/>
      <rect x="34" y="36" width="22" height="20" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="8" y="8" width="22" height="16" rx="1" fill="rgba(255,255,255,0.25)"/>
      <rect x="34" y="8" width="22" height="16" rx="1" fill="rgba(255,255,255,0.15)"/>
    </svg>`,
    label: '바닥공사',
  },
  {
    keywords: ['창호', '창문', '도어', '유리'],
    gradient: 'linear-gradient(145deg, #0288D1 0%, #01579B 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="10" width="40" height="44" rx="3" stroke="rgba(255,255,255,0.9)" stroke-width="4" fill="rgba(255,255,255,0.1)"/>
      <line x1="32" y1="10" x2="32" y2="54" stroke="rgba(255,255,255,0.7)" stroke-width="3"/>
      <line x1="12" y1="32" x2="52" y2="32" stroke="rgba(255,255,255,0.7)" stroke-width="3"/>
      <circle cx="30" cy="32" r="2" fill="rgba(255,255,255,0.9)"/>
      <circle cx="34" cy="32" r="2" fill="rgba(255,255,255,0.9)"/>
    </svg>`,
    label: '창호공사',
  },
  {
    keywords: ['전기', '전력', '조명'],
    gradient: 'linear-gradient(145deg, #F9A825 0%, #F57F17 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M36 8 L24 32 L32 32 L28 56 L44 28 L36 28 Z" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
    </svg>`,
    label: '전기공사',
  },
  {
    keywords: ['설비', '배관', '위생', '냉난방', '기계'],
    gradient: 'linear-gradient(145deg, #00897B 0%, #00695C 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20 Q20 20 20 32 Q20 44 32 44 Q44 44 44 32 Q44 20 56 20" stroke="rgba(255,255,255,0.9)" stroke-width="5" stroke-linecap="round" fill="none"/>
      <circle cx="12" cy="20" r="5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="52" cy="20" r="5" fill="rgba(255,255,255,0.7)"/>
    </svg>`,
    label: '설비공사',
  },
  {
    keywords: ['소방', '방재', '스프링클러'],
    gradient: 'linear-gradient(145deg, #E53935 0%, #B71C1C 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8 C20 20 12 30 12 40 C12 52 21 58 32 58 C43 58 52 52 52 40 C52 30 44 20 32 8Z" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.9)" stroke-width="3"/>
      <path d="M32 22 C26 30 22 36 22 42 C22 48 26 52 32 52 C38 52 42 48 42 42 C42 36 38 30 32 22Z" fill="rgba(255,255,255,0.5)"/>
    </svg>`,
    label: '소방공사',
  },
  {
    keywords: ['외구', '조경', '포장', '담장', '울타리'],
    gradient: 'linear-gradient(145deg, #43A047 0%, #2E7D32 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="24" rx="18" ry="16" fill="rgba(255,255,255,0.4)"/>
      <rect x="28" y="38" width="8" height="16" rx="2" fill="rgba(255,255,255,0.7)"/>
      <ellipse cx="18" cy="30" rx="10" ry="9" fill="rgba(255,255,255,0.3)"/>
      <ellipse cx="46" cy="30" rx="10" ry="9" fill="rgba(255,255,255,0.3)"/>
      <rect x="8" y="54" width="48" height="4" rx="2" fill="rgba(255,255,255,0.5)"/>
    </svg>`,
    label: '외구공사',
  },
  {
    keywords: ['준공', '정리', '마무리'],
    gradient: 'linear-gradient(145deg, #1B2B4B 0%, #101D33 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" stroke="rgba(255,255,255,0.8)" stroke-width="4" fill="rgba(255,255,255,0.1)"/>
      <path d="M20 32 L28 40 L44 24" stroke="rgba(255,255,255,0.95)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,
    label: '준공정리',
  },
  {
    keywords: ['슬래브', '콘크리트'],
    gradient: 'linear-gradient(145deg, #78909C 0%, #546E7A 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="26" width="48" height="12" rx="2" fill="rgba(255,255,255,0.9)"/>
      <rect x="14" y="14" width="6" height="14" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="26" y="14" width="6" height="14" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="38" y="14" width="6" height="14" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="50" y="14" width="6" height="14" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="14" y="38" width="6" height="14" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="26" y="38" width="6" height="14" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="38" y="38" width="6" height="14" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="50" y="38" width="6" height="14" rx="1" fill="rgba(255,255,255,0.4)"/>
    </svg>`,
    label: '슬래브공사',
  },
  {
    keywords: ['조적', '벽돌', '벽체', '경량'],
    gradient: 'linear-gradient(145deg, #BF360C 0%, #8D1F00 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="20" height="10" rx="1" fill="rgba(255,255,255,0.8)"/>
      <rect x="32" y="10" width="24" height="10" rx="1" fill="rgba(255,255,255,0.8)"/>
      <rect x="8" y="24" width="24" height="10" rx="1" fill="rgba(255,255,255,0.7)"/>
      <rect x="36" y="24" width="20" height="10" rx="1" fill="rgba(255,255,255,0.7)"/>
      <rect x="8" y="38" width="20" height="10" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="32" y="38" width="24" height="10" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="8" y="52" width="24" height="10" rx="1" fill="rgba(255,255,255,0.5)"/>
      <rect x="36" y="52" width="20" height="10" rx="1" fill="rgba(255,255,255,0.5)"/>
    </svg>`,
    label: '조적공사',
  },
  {
    keywords: ['방수'],
    gradient: 'linear-gradient(145deg, #1565C0 0%, #0D47A1 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 44 Q16 32 22 44 Q28 56 34 44 Q40 32 46 44 Q52 56 58 44" stroke="rgba(255,255,255,0.9)" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M10 30 Q16 18 22 30 Q28 42 34 30 Q40 18 46 30 Q52 42 58 30" stroke="rgba(255,255,255,0.5)" stroke-width="4" stroke-linecap="round" fill="none"/>
    </svg>`,
    label: '방수공사',
  },
  {
    keywords: ['내부마감', '내장', '도배', '도장', '마감'],
    gradient: 'linear-gradient(145deg, #8E6B3E 0%, #6B4C2A 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="44" height="44" rx="3" stroke="rgba(255,255,255,0.8)" stroke-width="3" fill="rgba(255,255,255,0.1)"/>
      <path d="M24 44 L32 20 L40 44" stroke="rgba(255,255,255,0.9)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <line x1="26" y1="38" x2="38" y2="38" stroke="rgba(255,255,255,0.7)" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
    label: '내부마감공사',
  },
  {
    keywords: ['승강기', '엘리베이터', 'EV'],
    gradient: 'linear-gradient(145deg, #546E7A 0%, #37474F 100%)',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="8" width="28" height="48" rx="3" stroke="rgba(255,255,255,0.9)" stroke-width="3" fill="rgba(255,255,255,0.1)"/>
      <line x1="32" y1="8" x2="32" y2="56" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      <path d="M24 28 L32 20 L40 28" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M24 36 L32 44 L40 36" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,
    label: '승강기공사',
  },
];

const DEFAULT_THEME = {
  gradient: 'linear-gradient(145deg, #4A5568 0%, #2D3748 100%)',
  icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="40" height="40" rx="4" stroke="rgba(255,255,255,0.8)" stroke-width="3" fill="rgba(255,255,255,0.1)"/>
    <line x1="12" y1="32" x2="52" y2="32" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
    <line x1="32" y1="12" x2="32" y2="52" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
  </svg>`,
};

/**
 * 대공정 이름으로 테마를 반환
 * @param {string} name - 대공정 이름
 * @returns {{ gradient: string, icon: string }}
 */
export function getProcessTheme(name = '') {
  const lower = name.toLowerCase();
  const matched = PROCESS_THEMES.find((theme) =>
    theme.keywords.some((kw) => lower.includes(kw))
  );
  return matched ?? DEFAULT_THEME;
}
