-- ============================================================
-- BPR (Builder Process Repo) Database Schema
-- MySQL 8.0 / bpr_db
-- ============================================================

-- 먼저 DB 없으면 생성
CREATE DATABASE IF NOT EXISTS bpr_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bpr_db;

-- ============================================================
-- 1. 사용자 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    login_id    VARCHAR(50)     NOT NULL UNIQUE,        -- 테스트 계정용 ID (test1234)
    password    VARCHAR(255),                           -- OAuth2 유저는 null 가능
    name        VARCHAR(50)     NOT NULL,               -- 표시 이름 (예: 노광수)
    role        ENUM('USER', 'ADMIN') DEFAULT 'USER',
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. 현장(프로젝트) 테이블
--    유저 1명 = 현장 1개 (프로토타입 기준)
--    추후 결제 도입 시 여러 현장 지원으로 확장 가능
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT          NOT NULL,
    name        VARCHAR(100)    NOT NULL,               -- 현장명 (예: 홍길동 단독주택)
    address     VARCHAR(255),                           -- 현장주소 (정식 주소 없을 수 있음)
    lat         DECIMAL(10, 8),                         -- 위도 (카카오맵 기반)
    lng         DECIMAL(11, 8),                         -- 경도 (카카오맵 기반)
    start_date  DATE            NOT NULL,               -- 착공일
    end_date    DATE            NOT NULL,               -- 준공예정일
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. 공정 템플릿 테이블 (공정 저장소)
--    is_default = true → 시스템 기본 템플릿 (모든 유저에게 노출, 수정/삭제 불가)
--    is_default = false → 유저 개인 템플릿
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT,                                 -- NULL이면 시스템 기본 템플릿
    name        VARCHAR(100)    NOT NULL,               -- 템플릿 이름 (예: 소형 단독주택)
    is_default  BOOLEAN         DEFAULT FALSE,
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. 템플릿 대공정 (공정 저장소 안의 대공정)
-- ============================================================
CREATE TABLE IF NOT EXISTS template_major_processes (
    id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
    template_id     BIGINT      NOT NULL,
    name            VARCHAR(100) NOT NULL,              -- 예: 기초공사, 마당타설
    display_order   INT         NOT NULL DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. 템플릿 소공정 (공정 저장소 안의 소공정)
-- ============================================================
CREATE TABLE IF NOT EXISTS template_minor_processes (
    id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
    major_id        BIGINT      NOT NULL,
    name            VARCHAR(100) NOT NULL,              -- 예: 터다지기, 비닐덮기
    display_order   INT         NOT NULL DEFAULT 0,
    has_divider     BOOLEAN     DEFAULT FALSE,          -- 소공정 목록 내 구분선
    FOREIGN KEY (major_id) REFERENCES template_major_processes(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. 실제 작업 대공정 (프로젝트에 귀속된 대공정)
--    템플릿에서 복사하거나 직접 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS major_processes (
    id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT      NOT NULL,
    name            VARCHAR(100) NOT NULL,
    display_order   INT         NOT NULL DEFAULT 0,
    created_at      DATETIME    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. 실제 작업 소공정 (BPR의 핵심 데이터 단위)
--    대시보드의 "오늘 할 일"은 이 테이블의 is_today = true 필터
--    체크리스트 ↔ 대시보드가 같은 레코드를 바라보므로 실시간 동기화
-- ============================================================
CREATE TABLE IF NOT EXISTS minor_processes (
    id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
    major_id        BIGINT      NOT NULL,
    name            VARCHAR(100) NOT NULL,
    status          ENUM('WAITING', 'IN_PROGRESS', 'TOUCH_UP', 'DONE') DEFAULT 'WAITING',
    -- WAITING: 대기 / IN_PROGRESS: 진행중 / TOUCH_UP: 잔손보기 / DONE: 완료
    memo            TEXT,                               -- 인라인 메모 (공정 저장소 이동 시 제외)
    is_today        BOOLEAN     DEFAULT FALSE,          -- 오늘 할 일 지정 여부
    display_order   INT         NOT NULL DEFAULT 0,
    has_divider     BOOLEAN     DEFAULT FALSE,          -- 구분선 여부
    created_at      DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (major_id) REFERENCES major_processes(id) ON DELETE CASCADE
);

-- ============================================================
-- 8. 일지(보고서) 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT      NOT NULL,
    report_date     DATE        NOT NULL,               -- 보고서 날짜
    weather         VARCHAR(50),                        -- 기상청 API 날씨값
    created_at      DATETIME    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ============================================================
-- 9. 보고서 항목 (소공정 스냅샷)
--    체크리스트 원본이 수정되어도 보고서는 영향 없음
--    → 보고서 저장 시 소공정 데이터를 snapshot으로 복사
-- ============================================================
CREATE TABLE IF NOT EXISTS report_items (
    id                  BIGINT      AUTO_INCREMENT PRIMARY KEY,
    report_id           BIGINT      NOT NULL,
    minor_process_id    BIGINT,                         -- 소공정 삭제 시 NULL로 유지
    name_snapshot       VARCHAR(100) NOT NULL,          -- 저장 시점의 소공정명
    memo_snapshot       TEXT,                           -- 저장 시점의 메모 (보고서 내 편집 가능)
    status_snapshot     ENUM('WAITING', 'IN_PROGRESS', 'TOUCH_UP', 'DONE') NOT NULL,
    display_order       INT         NOT NULL DEFAULT 0,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (minor_process_id) REFERENCES minor_processes(id) ON DELETE SET NULL
);

-- ============================================================
-- 초기 데이터: 시스템 기본 템플릿
--   템플릿 1: 공장동 (철골조 H빔) → template_id = 1
--   템플릿 2: 사무동 (철골조 H빔) → template_id = 2
-- ============================================================
INSERT INTO templates (user_id, name, is_default) VALUES
    (NULL, '공장동 (철골조 H빔)', TRUE),
    (NULL, '사무동 (철골조 H빔)', TRUE);

-- ============================================================
-- [공장동] 대공정 12개 → major_id 1~12
-- ============================================================
INSERT INTO template_major_processes (template_id, name, display_order) VALUES
    (1, '가설공사',    1),   -- major_id = 1
    (1, '토공사',      2),   -- major_id = 2
    (1, '기초공사',    3),   -- major_id = 3
    (1, '철골공사',    4),   -- major_id = 4
    (1, '지붕·외벽공사', 5), -- major_id = 5
    (1, '바닥공사',    6),   -- major_id = 6
    (1, '창호공사',    7),   -- major_id = 7
    (1, '전기공사',    8),   -- major_id = 8
    (1, '설비공사',    9),   -- major_id = 9
    (1, '소방공사',   10),   -- major_id = 10
    (1, '외구공사',   11),   -- major_id = 11
    (1, '준공정리',   12);   -- major_id = 12

-- [공장동] 가설공사 소공정 (major_id = 1)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (1, '가설울타리 설치',   1),
    (1, '현장사무소 설치',   2),
    (1, '가설전기 인입',     3),
    (1, '가설용수 인입',     4),
    (1, '가설화장실 설치',   5),
    (1, '안전시설물 설치',   6);

-- [공장동] 토공사 소공정 (major_id = 2)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (2, '터파기',    1),
    (2, '잔토 처리', 2),
    (2, '되메우기',  3),
    (2, '정지작업',  4),
    (2, '지반다짐',  5);

-- [공장동] 기초공사 소공정 (major_id = 3)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (3, '버림콘크리트 타설', 1),
    (3, '먹매김',           2),
    (3, '기초철근 배근',    3),
    (3, '기초거푸집 설치',  4),
    (3, '기초콘크리트 타설', 5),
    (3, '기초양생',         6),
    (3, '기초거푸집 해체',  7);

-- [공장동] 철골공사 소공정 (major_id = 4)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (4, '앵커볼트 매립',   1),
    (4, '철골 반입 검수',  2),
    (4, 'H빔 기둥 세우기', 3),
    (4, 'H빔 보 설치',     4),
    (4, '브레이싱 설치',   5),
    (4, '고력볼트 체결',   6),
    (4, '용접',            7),
    (4, '내화피복',        8);

-- [공장동] 지붕·외벽공사 소공정 (major_id = 5)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (5, '지붕 데크플레이트 설치', 1),
    (5, '지붕 단열재 시공',       2),
    (5, '지붕 판넬 설치',         3),
    (5, '홈통·물끊기 설치',       4),
    (5, '외벽 철골 가트 설치',    5),
    (5, '외벽 단열재 시공',       6),
    (5, '외벽 판넬 설치',         7);

-- [공장동] 바닥공사 소공정 (major_id = 6)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (6, '방습비닐 깔기',    1),
    (6, '와이어메쉬 설치',  2),
    (6, '바닥콘크리트 타설', 3),
    (6, '바닥양생',         4),
    (6, '표면경화제 시공',  5),
    (6, '바닥줄눈 시공',    6);

-- [공장동] 창호공사 소공정 (major_id = 7)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (7, '창호틀 설치',      1),
    (7, '유리 시공',        2),
    (7, '방화문 설치',      3),
    (7, '오버헤드도어 설치', 4),
    (7, '실란트·코킹',      5);

-- [공장동] 전기공사 소공정 (major_id = 8)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (8, '전기 인입 배관', 1),
    (8, '분전반 설치',    2),
    (8, '조명 배선',      3),
    (8, '콘센트 배선',    4),
    (8, '조명기구 설치',  5),
    (8, '접지공사',       6),
    (8, '수전 신청',      7);

-- [공장동] 설비공사 소공정 (major_id = 9)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (9, '급수배관',      1),
    (9, '오배수배관',    2),
    (9, '소방배관',      3),
    (9, '위생기구 설치', 4),
    (9, '환기팬 설치',   5);

-- [공장동] 소방공사 소공정 (major_id = 10)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (10, '소화배관 설치',       1),
    (10, '스프링클러 헤드 설치', 2),
    (10, '소화전 설치',         3),
    (10, '감지기 설치',         4),
    (10, '수신반 설치',         5),
    (10, '소방 준공검사',       6);

-- [공장동] 외구공사 소공정 (major_id = 11)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (11, '외부 토공 정지', 1),
    (11, '우수측구 설치',  2),
    (11, '아스콘 포장',    3),
    (11, '경계석 설치',    4),
    (11, '조경식재',       5),
    (11, '주차라인 도색',  6);

-- [공장동] 준공정리 소공정 (major_id = 12)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (12, '자재 정리·반출',  1),
    (12, '가설물 철거',     2),
    (12, '준공청소',        3),
    (12, '관공서 검사',     4),
    (12, '준공서류 제출',   5),
    (12, '하자보수 점검',   6);

-- ============================================================
-- [사무동] 대공정 15개 → major_id 13~27
-- ============================================================
INSERT INTO template_major_processes (template_id, name, display_order) VALUES
    (2, '가설공사',        1),   -- major_id = 13
    (2, '토공사',          2),   -- major_id = 14
    (2, '기초공사',        3),   -- major_id = 15
    (2, '철골공사',        4),   -- major_id = 16
    (2, '슬래브공사',      5),   -- major_id = 17
    (2, '조적·경량벽체공사', 6), -- major_id = 18
    (2, '방수공사',        7),   -- major_id = 19
    (2, '창호공사',        8),   -- major_id = 20
    (2, '내부마감공사',    9),   -- major_id = 21
    (2, '전기공사',       10),   -- major_id = 22
    (2, '설비공사',       11),   -- major_id = 23
    (2, '소방공사',       12),   -- major_id = 24
    (2, '승강기공사',     13),   -- major_id = 25
    (2, '외구공사',       14),   -- major_id = 26
    (2, '준공정리',       15);   -- major_id = 27

-- [사무동] 가설공사 소공정 (major_id = 13)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (13, '가설울타리 설치',  1),
    (13, '현장사무소 설치',  2),
    (13, '가설전기 인입',    3),
    (13, '가설용수 인입',    4),
    (13, '가설화장실 설치',  5),
    (13, '안전시설물 설치',  6);

-- [사무동] 토공사 소공정 (major_id = 14)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (14, '터파기',    1),
    (14, '잔토 처리', 2),
    (14, '되메우기',  3),
    (14, '정지작업',  4),
    (14, '지반다짐',  5);

-- [사무동] 기초공사 소공정 (major_id = 15)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (15, '버림콘크리트 타설', 1),
    (15, '먹매김',           2),
    (15, '기초철근 배근',    3),
    (15, '기초거푸집 설치',  4),
    (15, '기초콘크리트 타설', 5),
    (15, '기초양생',         6),
    (15, '기초거푸집 해체',  7);

-- [사무동] 철골공사 소공정 (major_id = 16)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (16, '앵커볼트 매립',     1),
    (16, '철골 반입 검수',    2),
    (16, 'H빔 기둥 세우기',   3),
    (16, 'H빔 보 설치',       4),
    (16, '브레이싱 설치',     5),
    (16, '고력볼트 체결',     6),
    (16, '용접',              7),
    (16, '데크플레이트 설치', 8),
    (16, '내화피복',          9);

-- [사무동] 슬래브공사 소공정 (major_id = 17)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (17, '슬래브 철근 배근',    1),
    (17, '슬래브 거푸집 설치',  2),
    (17, '설비배관 선시공',     3),
    (17, '슬래브콘크리트 타설', 4),
    (17, '슬래브양생',         5),
    (17, '거푸집 해체',        6);

-- [사무동] 조적·경량벽체공사 소공정 (major_id = 18)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (18, '먹매김',           1),
    (18, '조적쌓기',         2),
    (18, '경량스터드 벽체 설치', 3),
    (18, '단열재 충진',      4),
    (18, '석고보드 시공',    5);

-- [사무동] 방수공사 소공정 (major_id = 19)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (19, '옥상 방수',   1),
    (19, '화장실 방수', 2),
    (19, '외벽 실란트', 3);

-- [사무동] 창호공사 소공정 (major_id = 20)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (20, '커튼월 프레임 설치', 1),
    (20, '유리 시공',          2),
    (20, '출입문 설치',        3),
    (20, '방화문 설치',        4),
    (20, '실란트·코킹',        5);

-- [사무동] 내부마감공사 소공정 (major_id = 21)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (21, '바닥 레벨링',      1),
    (21, '바닥재 시공',      2),
    (21, '벽체 퍼티·페인트', 3),
    (21, '천장 경량틀 설치', 4),
    (21, '천장 텍스타일 시공', 5),
    (21, '걸레받이 설치',    6);

-- [사무동] 전기공사 소공정 (major_id = 22)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (22, '전기 인입 배관', 1),
    (22, '분전반 설치',    2),
    (22, '조명 배선',      3),
    (22, '콘센트 배선',    4),
    (22, '통신 배선',      5),
    (22, '조명기구 설치',  6),
    (22, '접지공사',       7),
    (22, '수전 신청',      8);

-- [사무동] 설비공사 소공정 (major_id = 23)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (23, '급수배관',      1),
    (23, '오배수배관',    2),
    (23, '소방배관',      3),
    (23, '위생기구 설치', 4),
    (23, '에어컨 배관',   5),
    (23, '환기덕트 설치', 6);

-- [사무동] 소방공사 소공정 (major_id = 24)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (24, '소화배관 설치',        1),
    (24, '스프링클러 헤드 설치', 2),
    (24, '소화전 설치',          3),
    (24, '감지기 설치',          4),
    (24, '수신반 설치',          5),
    (24, '소방 준공검사',        6);

-- [사무동] 승강기공사 소공정 (major_id = 25)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (25, '승강기 피트 확인',   1),
    (25, '레일 설치',          2),
    (25, '승강기 본체 설치',   3),
    (25, '시운전',             4),
    (25, '승강기 검사',        5);

-- [사무동] 외구공사 소공정 (major_id = 26)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (26, '외부 토공 정지', 1),
    (26, '우수측구 설치',  2),
    (26, '아스콘 포장',    3),
    (26, '경계석 설치',    4),
    (26, '조경식재',       5),
    (26, '주차라인 도색',  6);

-- [사무동] 준공정리 소공정 (major_id = 27)
INSERT INTO template_minor_processes (major_id, name, display_order) VALUES
    (27, '자재 정리·반출', 1),
    (27, '가설물 철거',    2),
    (27, '준공청소',       3),
    (27, '관공서 검사',    4),
    (27, '준공서류 제출',  5),
    (27, '하자보수 점검',  6);
