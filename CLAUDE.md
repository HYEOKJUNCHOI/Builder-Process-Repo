# BPR (Builder Process Repo) Development Ground Rules

이 문서는 BPR 프로젝트의 일관된 개발 경험과 코드 품질을 유지하기 위한 절대 원칙입니다. 모든 AI 엔진은 이 규칙을 준수하여 작업해야 합니다.

---

## 1. Stack & Environment
- **Web Frontend:** React 18+ (Vite), TypeScript
- **Mobile App:** React Native (Expo) — 현장 접근성 강화
- **State Management:** - Client: Zustand
  - Server: Tanstack React-Query (서버 상태 및 실시간 동기화)
- **Styling:** Emotion (css-in-js 방식)
- **Backend:** Spring Boot 3.5.x, Java 21 (Virtual Threads)
- **DB:** MySQL 8.0
- **Caching:** Redis (세션, 토큰, 유저 정보)
- **Auth:** JWT 토큰 인증 (Access/Refresh) + OAuth2 (Naver, Kakao — 준비 중)
- **AI Engine:** Claude API — 추후 보고서 자동화 등에 활용 예정 (현재 미적용)
- **Resolution:** 720px (모바일 퍼스트 기준)

---

## 2. File Structure & Role Rules
기능 단위 폴더 구조를 유지하며, 한 페이지를 작업할 때 필요한 모든 파일(화면, 스타일, API)을 한 폴더 내에서 관리한다.

### Directory Structure
- `pages/`: 페이지별 폴더 (Dashboard, Checklist, ProcessRepo, Report, Login)
  - `*.jsx`: 화면 컴포넌트 (렌더링 및 이벤트 핸들링만 담당)
  - `*.style.js`: Emotion 스타일 (S.접두사 사용)
  - `*.api.js`: 해당 페이지의 API 호출 함수 (axios 요청 정의)
- `components/`: 공통 컴포넌트
  - `common/`: Button, Modal, Toast 등 범용 UI
  - `layout/`: Header, BottomNav 등 레이아웃
- `hooks/`: 커스텀 훅 (useAuth, useChecklist 등)
- `store/`: Zustand 스토어
- `utils/`: 유틸리티 함수 (날짜 계산, 포맷 변환 등)
- `styles/`: GlobalStyle.js, theme.js (전역 스타일 및 테마)

### File Extension Rules
- **.jsx**: 화면 컴포넌트 전용. 비즈니스 로직이 길어지면 커스텀 훅으로 분리.
- **.js**: 설정, 인프라, 스타일, API, 유틸리티 등 JSX 문법이 필요 없는 모든 파일.
  - 예: `queryClient.js`, `axiosConfig.js`, `Dashboard.style.js`, `Checklist.api.js`

---

## 3. Coding Standards (Quality & Readability)
- **Naming Convention:**
  - 컴포넌트: `PascalCase` (예: ChecklistCard)
  - 함수/변수: `camelCase` (예: getProgressRate)
  - 스타일 컴포넌트: `S.PascalCase` (예: S.Container, S.CardWrapper)
  - API 함수: `fetch/create/update/delete` 접두사 (예: fetchChecklist)
  - 상수: `UPPER_SNAKE_CASE` (예: MAX_RETRY_COUNT)
- **Principles:**
  - "왜" 이렇게 작성했는지 의도를 설명하는 **한국어 주석** 필수.
  - 한 파일이 **300줄**을 넘으면 반드시 하위 컴포넌트로 분리.
  - 예외 상황(Error Handling)을 항상 고려하여 작성.

---

## 4. Communication & Persona
- **Language:** 모든 설명과 주석은 **'한국어'**로 작성한다.
- **Method:** 초보자도 이해할 수 있게 쉽게 설명하되, 비즈니스 로직과 구조를 명확히 짚어준다.
- **Proactive:** 요청에 잠재된 리스크나 더 나은 대안이 있다면 파트너로서 능동적으로 제안한다.
- **Format:** **[결론/해결책] → [코드] → [상세 설명]** 순서로 답변한다.

---

## 5. Claude Code 전략
- **사용 도구:** Claude Code 단독 사용. 다른 AI 코딩 도구 혼용 없음.
- **모델 운용:**
  - `claude-opus-4-6`: 설계·뼈대·아키텍처 결정 단계
  - `claude-sonnet-4-6`: 일반 코드 구현 단계
- **모델 최적화 (양방향):**
  - 작업 시작 전 복잡도를 스스로 판단한다.
  - **낮춤 (비용 절감):** 단순 반복·소규모 수정이라면 낮은 모델로 전환을 제안한다.
    > 예: "이 작업은 `claude-sonnet-4-6`으로도 충분할 것 같습니다. 변경할까요?"
  - **올림 (품질 우선):** 설계 결정·아키텍처 변경·복잡한 트레이드오프 판단이 필요한 경우, 현재 Sonnet으로 작업 중이라면 Opus 전환을 제안한다.
    > 예: "이 작업은 구조적 판단이 필요합니다. `claude-opus-4-6`으로 변경하는 것을 권장합니다. 변경할까요?"
  - **단, 확신이 없는 경우 솔직히 이유를 밝힌다.** 잘못된 판단으로 비용 절감 또는 품질을 착각하게 만들지 않는다.
- **모델 변경:** 반드시 사용자 승인 후 진행한다. 임의로 변경하지 않는다.
- **No Arbitrary Changes:** 사용자가 태스크 진행 상황을 인지할 수 있도록, 부족한 부분 보강은 하되 기존 태스크를 임의로 변경하거나 생략하지 않는다.

## 6. DOM 식별 전략 (data-qa 규칙)

- **목적:** CSS-in-JS 환경에서는 className이 자동 생성되어 DevTools에서 코드 위치를 찾기 어렵기 때문에, 주요 DOM 요소에 `data-qa` 속성을 추가해 코드 위치를 즉시 식별할 수 있도록 한다.

- **적용 시점:** 새로운 페이지 또는 주요 UI 컴포넌트를 생성하거나 수정할 때, 해당 루트 요소에 `data-qa` 속성을 반드시 추가한다.

- **적용 범위:** 의미 있는 기능 단위의 **루트 컨테이너에만** 적용하며, 내부 하위 요소에는 무분별하게 추가하지 않는다.

- **적용 대상:**
  - 페이지 루트 div
  - `header`
  - `section`
  - `select`
  - `button`
  - 리스트 컨테이너 (`map` 함수의 부모 요소)
  - 주요 기능 단위의 최상위 컨테이너

- **명명 규칙:** `data-qa="페이지명-역할"` 형식을 사용하며, kebab-case를 사용하고 중복되지 않도록 한다.

- **예시:**
  - `data-qa="checklist-page"`
  - `data-qa="checklist-header"`
  - `data-qa="checklist-site-select"`
  - `data-qa="checklist-add-button"`
  - `data-qa="checklist-item-list"`

- **사용 제한:** `data-qa`는 스타일링 또는 로직 제어 목적이 아닌, DevTools 기반 위치 식별 및 유지보수 목적에만 사용한다.

- **기대 효과:** DevTools에서 즉시 코드 위치 식별이 가능해지고, UI 수정 속도와 AI 코드 수정 정확도가 향상되며 유지보수 비용이 감소한다.

---

## 7. 레이아웃 최소 변경 원칙

- **사용자가 지정한 요소와 그 부모 컨테이너 내부에서만** 수정한다.
- 사용자가 변경을 명시하지 않은 요소의 **위치, 크기, 패딩, 정렬, 줄 구조는 절대 변경하지 않는다.**
- 기존 요소를 **이동하거나 재배치하지 않는다.**
- 새로운 줄을 만들거나 기존 줄을 나누지 않는다.
- 기존 레이아웃을 재구성하지 않는다.

> **기준:** 레이아웃을 "재설계"하지 말고, 기존 구조 안에 요소를 **"추가 또는 이동만"** 한다.