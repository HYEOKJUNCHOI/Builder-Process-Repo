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
- **작성 시각:** 2026-03-05
- **브랜치:** feature/ag-checklist-and-directory
- **마지막 커밋:** [CC] feat+fix: Dashboard UI 개편 및 Report 일지 기능 완성

---

### 프로젝트 개요 (처음 받는 AI를 위한 요약)
BPR(Builder Process Repo)은 건설 현장 소장이 공정을 관리하는 모바일 웹앱이다.
핵심 개념: 대공정(마당타설, 기초공사 등) > 소공정(세부 작업 단위). 소공정 상태는 대기→진행→마무리→완료로 순환한다.

> ⚠️ **백엔드가 Firebase Firestore로 전환됨** (AG 작업). Spring Boot 백엔드는 현재 미사용.
> 모든 `*.api.js`가 Firestore SDK를 직접 호출한다. `utils/firebaseConfig.js` 참고.

**스택:**
- Frontend: React 18 + Vite, Emotion(CSS-in-JS), TanStack React-Query, Zustand
- DB/Auth: Firebase Firestore + Firebase Auth (JWT 방식 → Firebase로 교체됨)

---

### 프로젝트 구조

```
bpr-frontend/src/
  pages/
    Dashboard/     — 대시보드 (오늘 할 일 + 진척도)
    Checklist/     — 체크리스트 (무한스크롤 소공정 목록 + 대공정 네비)
    Report/        — 일지 (오늘 공정 담기 + 메모 + 삭제 + PDF/복사)
    Directory/     — 연락처 (AG 신규 추가)
    Login/         — 로그인
  components/
    common/StatsSection  — 진척도/진행도/공정편차 3링 통계 다크박스
    layout/TopBar        — 인사말 + 로그아웃 (날짜/요일 제거됨)
    layout/BottomNav     — 하단 탭 네비
  hooks/useWeather.js    — 주소 기반 날씨 (기상청 API)
  store/authStore.js     — Zustand 인증 상태 (Firebase uid)
  utils/firebaseConfig.js — Firebase 초기화 (db export)
  styles/theme.js        — 색상/폰트/radius 테마 변수
```

---

### Firestore 데이터 구조

```
projects/{projectId}
  .name, .address, .startDate, .endDate, .ownerId

projects/{projectId}/major_processes/{majorId}
  .name, .displayOrder, .createdAt

projects/{projectId}/minor_processes/{minorId}
  .majorId, .name, .status (WAITING|IN_PROGRESS|TOUCH_UP|DONE)
  .isToday, .memo, .displayOrder, .createdAt

projects/{projectId}/reports/{reportId}
  .reportDate (YYYY-MM-DD), .weather, .authorName
  .additionalMemo, .createdAt

projects/{projectId}/reports/{reportId}/items/{itemId}
  .minorProcessId, .nameSnapshot, .statusSnapshot, .memoSnapshot

templates/{templateId}
  /template_major_processes/{}/template_minor_processes/{}
```

---

### 현재 구현 완료 목록

#### 대시보드 (`Dashboard.jsx` + `Dashboard.style.js`)
- DateBlock(날짜/요일) + WeatherGroup(현재날씨·강수·내일날씨 3카드) — 2:7 가로 비율
- StatsSection 다크박스 ("현장 성과" 타이틀 + 3링 원형 게이지)
- 오늘 할 일 목록: 상태순환(★) · 메모(✎) · 일지담기(📝) · 오늘할일해제(★)
- 현장 선택 드롭다운, 대시보드↔체크리스트 캐시 양방향 동기화

#### 체크리스트 (`Checklist.jsx` — AG 개편, 무한스크롤)
- 대공정 네비게이션 탭 (좌측 또는 상단)
- 소공정 무한스크롤 목록
- 상태순환·오늘할일·메모(✎)·일지담기(📝) 버튼
- 현장 생성/수정/삭제, 대공정/소공정 추가/삭제

#### 일지 (`Report.jsx` + `Report.api.js`)
- 📝 버튼 → Upsert 방식 (오늘 report 있으면 item 추가, 없으면 신규 생성)
- 동일 소공정 중복 추가 방지 (`where('minorProcessId', '==', ...)`)
- 공정 항목별 메모 토글(✎) + 저장
- 공정 항목 삭제(✕)
- 배지 줄맞춤 (`StatusChip min-width: 46px`)
- 대시보드 상태 변경 → 일지 statusSnapshot 실시간 동기화 (`cycleStatus`에서 처리)
- 이전 보고서 바텀시트, PDF 내보내기, 글복사

#### 연락처 (`Directory/` — AG 신규)
- 작업 이어받으면 Directory.jsx 직접 읽어볼 것

---

### 아직 안 한 일 / 이어서 해야 할 일

1. **소공정 드래그 정렬** — `@dnd-kit/core` 또는 `react-beautiful-dnd` 검토 필요. Firestore `displayOrder` 필드는 이미 있음.

2. **공정 저장소 디폴트 템플릿** — 시스템 기본 템플릿 Firestore에 시드 필요. SeedPage.jsx/seedTemplates.js 파일이 있으나 미사용.

3. **체크리스트 → 공정저장소 내보내기** — 미구현.

4. **일지 사진 첨부** — `photos` state는 있으나 Firebase Storage 업로드 미구현. 로컬 미리보기만 됨.

5. **디자인 껍데기 반영** — Google Stitch 디자인 기반으로 각 페이지 스타일 교체 예정.

---

### 주의사항 / 반드시 알아야 할 것

1. **Firebase 전환**: `axiosConfig.js` 삭제됨. `utils/firebaseConfig.js`에서 `db` import해서 사용.

2. **날씨**: `useWeather(address)` — 주소 없으면 null. 체크리스트는 `tomorrow`, 대시보드는 `weather`.

3. **cycleStatus 사이드이펙트**: 소공정 상태 변경 시 오늘 report items의 `statusSnapshot`도 자동 갱신됨 (`Checklist.api.js` 참고).

4. **memoSnapshot vs memo**: 일지 item의 메모 필드는 `memoSnapshot`. 소공정의 메모 필드는 `memo`. 혼용하지 말 것.

5. **createReport는 Upsert**: 오늘 날짜 report가 이미 있으면 item만 추가. 새 report를 만들지 않는다.

6. **React-Query 캐시 키**:
   - `['projects']` — 현장 목록
   - `['checklist', projectId]` — 체크리스트
   - `['dashboard', projectId]` — 오늘 할 일
   - `['reports', projectId]` — 일지 목록
   - `['report-today', projectId]` — 오늘 일지

7. **Emotion 스타일**: `S.컴포넌트명`. 각 페이지 폴더의 `*.style.js`. `theme.js` 변수 필수 활용.

8. **실행**: 프론트만 `bpr-frontend/`에서 `npm run dev`. 백엔드 불필요 (Firebase 직접 연결).
