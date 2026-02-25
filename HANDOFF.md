# HANDOFF.md — 핸드오프 프로토콜

> ⚠️ **이 구분선(===) 위의 규칙 영역은 절대 수정 금지.**
> AI는 아래 `인수인계 내용` 영역만 업데이트한다.

---

## 핸드오프 규칙

### 언제 핸드오프를 작성하는가?
- 사용자가 **"핸드오프 해"** 라고 지시하면 즉시 작업을 멈추고 핸드오프를 작성한다.
- AI가 스스로 판단해서 핸드오프를 작성하지 않는다. **반드시 사용자 지시가 있어야 한다.**

### 핸드오프 작성 절차
1. 현재 작업을 **안전한 상태까지 마무리**한다. (컴파일 에러가 없는 상태)
2. `git add → commit → push` 수행한다.
3. 아래 `인수인계 내용` 영역을 업데이트한다.
4. HANDOFF.md도 함께 커밋한다.

### 인수인계 받는 절차
1. `git pull`로 최신 코드를 받는다.
2. 이 파일의 `인수인계 내용`을 읽는다.
3. 언급된 파일들을 직접 열어 코드를 한 번 읽는다.
4. 이해한 내용을 바탕으로 **브랜치를 새로 파서** 작업을 이어간다.

### 작성 원칙
- **간결하게.** 소설 쓰지 말고, 핵심만 적는다.
- **파일 경로는 정확하게.** 수정한 파일 목록은 풀 경로로 적는다.
- **미완료 작업은 솔직하게.** 하다 만 것, 시도했지만 안 된 것을 숨기지 않는다.

---

### ⚠️ 이 선 아래만 수정할 것 ===================================================

---

## 인수인계 내용

### 작성 정보
- **작성자:** CC (Claude Code)
- **작성 시각:** 2026-02-26
- **브랜치:** main
- **마지막 커밋:** [CC] docs+feat: 협업 MD 동기화 및 체크리스트 헤더 1행 통합

---

### 프로젝트 개요 (처음 받는 AI를 위한 요약)
BPR(Builder Process Repo)은 건설 현장 소장이 공정을 관리하는 모바일 웹앱이다.
핵심 개념: 대공정(마당타설, 기초공사 등) > 소공정(세부 작업 단위). 소공정 상태는 대기→진행→마무리→완료로 순환한다.
전체 기능 정의는 `PROJECT.md`를 읽어라. 디자인 원칙도 거기에 있다.

**스택:**
- Frontend: React 18 + Vite, Emotion(CSS-in-JS), TanStack React-Query, Zustand
- Backend: Spring Boot 3.5, Java 21, MySQL 8, Redis
- Auth: JWT (Access/Refresh), 테스트 계정: test1234 / 1234

---

### 프로젝트 구조

```
bpr-frontend/src/
  pages/
    Dashboard/     — 대시보드 (오늘 할 일 + 진척도)
    Checklist/     — 체크리스트 (대공정 카드 + 소공정 관리)
    ProcessRepo/   — 공정 저장소 (템플릿 관리)
    Report/        — 일지 작성
    Login/         — 로그인
  components/
    common/MajorProcessCard   — 대공정 카드 (이미지+진행도바)
    common/StatsSection       — 진척도/진행도/공정편차 통계 카드
    layout/TopBar, BottomNav  — 공통 레이아웃
  hooks/useWeather.js  — 주소 기반 날씨 (기상청 API)
  store/authStore.js   — Zustand 인증 상태
  utils/axiosConfig.js — axios 기본 설정 (JWT 헤더 자동 포함)
  styles/theme.js      — 색상/폰트/radius 테마 변수

bpr-backend/src/main/java/com/bpr/
  entity/   — Project, MajorProcess, MinorProcess, Template, Report, User
  dto/      — 요청/응답 DTO
  service/  — 비즈니스 로직
  controller/ — REST API 엔드포인트
  security/ — JWT 필터, JwtUtil
```

---

### 현재 구현 완료 목록

#### 백엔드 API (전부 `/api` prefix, JWT 인증 필요)
| 엔드포인트 | 설명 |
|---|---|
| POST /auth/login | JWT 로그인 (test1234/1234) |
| GET /projects | 내 현장 목록 |
| POST /projects | 현장 생성 (templateId 선택) |
| PATCH /projects/{id} | 현장 수정 (이름/주소/착공일/준공일) |
| DELETE /projects/{id} | 현장 삭제 (하위 대공정/소공정 cascade) |
| GET /checklist/{projectId} | 대공정+소공정 전체 조회 |
| POST /checklist/{projectId}/major | 대공정 추가 |
| DELETE /checklist/major/{majorId} | 대공정 삭제 |
| POST /checklist/major/{majorId}/minor | 소공정 추가 |
| DELETE /checklist/minor/{minorId} | 소공정 삭제 |
| PATCH /checklist/minor/{minorId}/status | 소공정 상태 순환 |
| PATCH /checklist/minor/{minorId}/today | 오늘 할 일 토글 |
| PATCH /checklist/minor/{minorId}/memo | 소공정 메모 수정 |
| GET /dashboard/{projectId} | 오늘 할 일 + 통계 |
| GET /templates | 공정 템플릿 목록 |
| POST /reports | 일지 생성 |
| GET /reports/{projectId} | 일지 목록 |
| GET /reports/{projectId}/today | 오늘 일지 |

#### 프론트엔드 — 체크리스트 페이지 (`Checklist.jsx` 700+줄)
- 현장 생성 (바텀시트 `CreateProjectSheet` — 이름/주소/착공일/준공일/템플릿 선택)
- 현장 수정 (바텀시트 `EditProjectSheet` — 기존 값 초기값으로 세팅)
- 현장 삭제 (confirm → deleteProject → 캐시 갱신)
- 대공정 카드 그리드 (4열, 이미지+진행도바)
- 대공정 추가/삭제
- 소공정 바텀시트 (상태순환·오늘할일·메모·추가·삭제·구분선)
- 헤더: `[체크리스트] [현장선택 드롭다운] [내일날씨] [수정버튼] [삭제버튼]` 1행

#### 프론트엔드 — 대시보드 (`Dashboard.jsx`)
- 날짜/날씨 + 현장 선택 드롭다운
- 진척도/진행도/공정편차 통계 카드 (`StatsSection` 컴포넌트)
- 오늘 할 일 목록 (상태순환·메모·일지담기·오늘할일해제)
- 대시보드 ↔ 체크리스트 React-Query 캐시 양방향 동기화

#### 프론트엔드 — 공정 저장소 (`ProcessRepo.jsx`)
- 템플릿 목록 조회 및 체크리스트로 불러오기

#### 프론트엔드 — 일지 (`Report.jsx`)
- 날짜/날씨로 일지 생성, 소공정 선택해서 담기
- 오늘 일지 자동 불러오기 + 기존 일지 목록

---

### 아직 안 한 일 / 이어서 해야 할 일

우선순위 순서:

1. **대시보드 진척도 게이지 원형화** — `StatsSection.jsx`에 현재 텍스트/숫자로만 표시. `PROJECT.md` 기준으로 원형(○) 게이지 3개(진척도·진행도·공정편차)로 교체 필요. 호버 툴팁(착공일/준공일), 공기지연 경고색 포함.

2. **소공정 드래그 정렬** — `PROJECT.md`에 "길게 눌러 드래그" 명시. 라이브러리 미선정. `react-beautiful-dnd` 또는 `@dnd-kit/core` 검토 필요. 정렬 저장 API 없음 → 백엔드 PATCH endpoint도 새로 필요.

3. **대시보드 오늘 할 일 접기/펼치기** — `PROJECT.md` 기준 `height transition` 애니메이션 접기/펼치기. 기본 상태 펼침. 현재 미구현.

4. **공정 저장소 디폴트 템플릿** — `Template` 엔티티에 `is_default` 컬럼 추가 후 시스템 기본 템플릿 노출. 현재 개인 템플릿만 표시됨.

5. **체크리스트 → 공정저장소 내보내기** — 현재 공정구조를 이름 붙여 저장소로 저장하는 버튼. 미구현.

6. **일지 사진 첨부** — `PROJECT.md`에 명시. 미구현.

7. **디자인 껍데기 반영** — 혁준이가 Google Stitch로 디자인을 만들면 그걸 기반으로 각 페이지 스타일 교체 예정.

---

### 주의사항 / 반드시 알아야 할 것

1. **날씨**: `useWeather(address)` — 현장 주소를 인자로 받아 기상청 API 호출. 주소 없으면 null 반환. GPS 미사용. 체크리스트는 내일 날씨(`tomorrow`), 대시보드는 오늘 날씨(`weather`) 사용.

2. **체크리스트 헤더 조건부 렌더링**: 현장이 0개이면 드롭다운·날씨·수정/삭제 버튼 전체가 숨겨진다 (`{projects.length > 0 && ...}`).

3. **대공정 카드 이미지**: `utils/processImageMap.js`에서 대공정 이름으로 이미지를 매핑. 등록되지 않은 이름은 기본 이미지 표시.

4. **구분선**: 소공정 이름이 `'─────────────────'` (특수문자 17개)이면 구분선으로 렌더링. `DIVIDER_NAME` 상수로 관리.

5. **소공정 상태 순환**: 프론트에서 API 한 번 호출하면 서버가 알아서 다음 상태로 순환. 상태값을 직접 지정하는 API 없음.

6. **React-Query 캐시 키**:
   - `['projects']` — 현장 목록
   - `['checklist', projectId]` — 체크리스트
   - `['dashboard', projectId]` — 오늘 할 일
   - `['reports', projectId]` — 일지 목록
   - `['report-today', projectId]` — 오늘 일지

7. **Emotion 스타일**: 모든 스타일 컴포넌트는 `S.컴포넌트명`으로 사용. 각 페이지 폴더의 `*.style.js` 파일에 정의. `theme.js`의 변수(`theme.color.navy` 등)를 반드시 활용.

8. **DESIGN.md**: 참고용 디자인 메뉴판이나, 실제 디자인은 Google Stitch로 진행 예정. 코드 작업 시 직접 참고하지 않아도 됨.

9. **서버 실행**: 백엔드는 IntelliJ에서 `BprApplication.java` 실행. 프론트는 `bpr-frontend/`에서 `npm run dev`.
