import { db } from '../../utils/firebaseConfig';
import { collection, doc, writeBatch } from 'firebase/firestore';
import useAuthStore from '../../store/authStore';

const USER_MAJORS = [
    { id: '3', name: '기초공사', displayOrder: 3 },
    { id: '4', name: '철골공사', displayOrder: 4 },
    { id: '5', name: '슬래브공사', displayOrder: 5 },
    { id: '6', name: '조적·경량벽체공사', displayOrder: 6 },
    { id: '7', name: '방수공사', displayOrder: 7 },
    { id: '8', name: '창호공사', displayOrder: 8 },
    { id: '9', name: '내부마감공사', displayOrder: 9 },
    { id: '10', name: '전기공사', displayOrder: 10 },
    { id: '11', name: '설비공사', displayOrder: 11 },
    { id: '12', name: '소방공사', displayOrder: 12 },
    { id: '13', name: '승강기공사', displayOrder: 13 },
    { id: '14', name: '외구공사', displayOrder: 14 },
    { id: '15', name: '준공정리', displayOrder: 15 },
    { id: '16', name: '쓰레기 배출', displayOrder: 14 },
    { id: '18', name: '타설', displayOrder: 15 }
];

const USER_MINORS = [
    { id: '12', majorId: '3', name: '버림콘크리트 타설', status: 'DONE', memo: null, isToday: false, displayOrder: 1 },
    { id: '13', majorId: '3', name: '먹매김', status: 'DONE', memo: '3층 옥상', isToday: true, displayOrder: 2 },
    { id: '14', majorId: '3', name: '기초철근 배근', status: 'IN_PROGRESS', memo: '우측 끝 잔손 조금남음', isToday: true, displayOrder: 3 },
    { id: '15', majorId: '3', name: '기초거푸집 설치', status: 'DONE', memo: '오후부터 작업예정', isToday: true, displayOrder: 4 },
    { id: '16', majorId: '3', name: '기초콘크리트 타설', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '17', majorId: '3', name: '기초양생', status: 'WAITING', memo: null, isToday: false, displayOrder: 6 },
    { id: '18', majorId: '3', name: '기초거푸집 해체', status: 'WAITING', memo: null, isToday: false, displayOrder: 7 },
    { id: '19', majorId: '4', name: '앵커볼트 매립', status: 'TOUCH_UP', memo: null, isToday: false, displayOrder: 1 },
    { id: '20', majorId: '4', name: '철골 반입 검수', status: 'TOUCH_UP', memo: null, isToday: true, displayOrder: 2 },
    { id: '21', majorId: '4', name: 'H빔 기둥 세우기', status: 'DONE', memo: null, isToday: true, displayOrder: 3 },
    { id: '22', majorId: '4', name: 'H빔 보 설치', status: 'IN_PROGRESS', memo: null, isToday: true, displayOrder: 4 },
    { id: '23', majorId: '4', name: '브레이싱 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '24', majorId: '4', name: '고력볼트 체결', status: 'WAITING', memo: null, isToday: false, displayOrder: 6 },
    { id: '25', majorId: '4', name: '용접', status: 'WAITING', memo: null, isToday: false, displayOrder: 7 },
    { id: '26', majorId: '4', name: '데크플레이트 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 8 },
    { id: '27', majorId: '4', name: '내화피복', status: 'WAITING', memo: null, isToday: false, displayOrder: 9 },
    { id: '28', majorId: '5', name: '슬래브 철근 배근', status: 'WAITING', memo: null, isToday: false, displayOrder: 1 },
    { id: '29', majorId: '5', name: '슬래브 거푸집 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '30', majorId: '5', name: '설비배관 선시공', status: 'WAITING', memo: null, isToday: false, displayOrder: 3 },
    { id: '31', majorId: '5', name: '슬래브콘크리트 타설', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '32', majorId: '5', name: '슬래브양생', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '33', majorId: '5', name: '거푸집 해체', status: 'WAITING', memo: null, isToday: false, displayOrder: 6 },
    { id: '34', majorId: '6', name: '먹매김', status: 'WAITING', memo: null, isToday: false, displayOrder: 1 },
    { id: '35', majorId: '6', name: '조적쌓기', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '36', majorId: '6', name: '경량스터드 벽체 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 3 },
    { id: '37', majorId: '6', name: '단열재 충진', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '38', majorId: '6', name: '석고보드 시공', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '39', majorId: '7', name: '옥상 방수', status: 'IN_PROGRESS', memo: null, isToday: false, displayOrder: 1 },
    { id: '40', majorId: '7', name: '화장실 방수', status: 'DONE', memo: '김반장 불러서 진행', isToday: true, displayOrder: 2 },
    { id: '41', majorId: '7', name: '외벽 실란트', status: 'WAITING', memo: null, isToday: false, displayOrder: 3 },
    { id: '42', majorId: '8', name: '커튼월 프레임 설치', status: 'IN_PROGRESS', memo: null, isToday: true, displayOrder: 1 },
    { id: '44', majorId: '8', name: '출입문 설치', status: 'IN_PROGRESS', memo: null, isToday: false, displayOrder: 3 },
    { id: '45', majorId: '8', name: '방화문 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '46', majorId: '8', name: '실란트·코킹', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '47', majorId: '9', name: '바닥 레벨링', status: 'WAITING', memo: null, isToday: false, displayOrder: 1 },
    { id: '48', majorId: '9', name: '바닥재 시공', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '49', majorId: '9', name: '벽체 퍼티·페인트', status: 'WAITING', memo: null, isToday: false, displayOrder: 3 },
    { id: '50', majorId: '9', name: '천장 경량틀 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '51', majorId: '9', name: '천장 텍스타일 시공', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '52', majorId: '9', name: '걸레받이 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 6 },
    { id: '53', majorId: '10', name: '전기 인입 배관', status: 'WAITING', memo: null, isToday: false, displayOrder: 1 },
    { id: '54', majorId: '10', name: '분전반 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '55', majorId: '10', name: '조명 배선', status: 'WAITING', memo: null, isToday: false, displayOrder: 3 },
    { id: '56', majorId: '10', name: '콘센트 배선', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '57', majorId: '10', name: '통신 배선', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '58', majorId: '10', name: '조명기구 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 6 },
    { id: '59', majorId: '10', name: '접지공사', status: 'WAITING', memo: null, isToday: false, displayOrder: 7 },
    { id: '60', majorId: '10', name: '수전 신청', status: 'WAITING', memo: null, isToday: false, displayOrder: 8 },
    { id: '61', majorId: '11', name: '급수배관', status: 'WAITING', memo: null, isToday: false, displayOrder: 1 },
    { id: '62', majorId: '11', name: '오배수배관', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '63', majorId: '11', name: '소방배관', status: 'WAITING', memo: null, isToday: false, displayOrder: 3 },
    { id: '64', majorId: '11', name: '위생기구 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '65', majorId: '11', name: '에어컨 배관', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '66', majorId: '11', name: '환기덕트 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 6 },
    { id: '67', majorId: '12', name: '소화배관 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 1 },
    { id: '68', majorId: '12', name: '스프링클러 헤드 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '69', majorId: '12', name: '소화전 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 3 },
    { id: '70', majorId: '12', name: '감지기 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '71', majorId: '12', name: '수신반 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '72', majorId: '12', name: '소방 준공검사', status: 'WAITING', memo: null, isToday: false, displayOrder: 6 },
    { id: '73', majorId: '13', name: '승강기 피트 확인', status: 'IN_PROGRESS', memo: null, isToday: false, displayOrder: 1 },
    { id: '74', majorId: '13', name: '레일 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '75', majorId: '13', name: '승강기 본체 설치', status: 'WAITING', memo: '안전모 주의주기', isToday: false, displayOrder: 3 },
    { id: '76', majorId: '13', name: '시운전', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '77', majorId: '13', name: '승강기 검사', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '78', majorId: '14', name: '외부 토공 정지', status: 'WAITING', memo: null, isToday: false, displayOrder: 1 },
    { id: '79', majorId: '14', name: '우수측구 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '80', majorId: '14', name: '아스콘 포장', status: 'WAITING', memo: null, isToday: false, displayOrder: 3 },
    { id: '81', majorId: '14', name: '경계석 설치', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '82', majorId: '14', name: '조경식재', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '83', majorId: '14', name: '주차라인 도색', status: 'WAITING', memo: null, isToday: false, displayOrder: 6 },
    { id: '84', majorId: '15', name: '자재 정리·반출', status: 'WAITING', memo: null, isToday: false, displayOrder: 1 },
    { id: '85', majorId: '15', name: '가설물 철거', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '86', majorId: '15', name: '준공청소', status: 'WAITING', memo: null, isToday: false, displayOrder: 3 },
    { id: '87', majorId: '15', name: '관공서 검사', status: 'WAITING', memo: null, isToday: false, displayOrder: 4 },
    { id: '88', majorId: '15', name: '준공서류 제출', status: 'WAITING', memo: null, isToday: false, displayOrder: 5 },
    { id: '89', majorId: '15', name: '하자보수 점검', status: 'WAITING', memo: null, isToday: false, displayOrder: 6 },
    { id: '92', majorId: '16', name: '2층 쓰레기 모음', status: 'WAITING', memo: '혁준 불러서 청소', isToday: true, displayOrder: 1 },
    { id: '93', majorId: '18', name: '마당타설', status: 'WAITING', memo: null, isToday: false, displayOrder: 1 },
    { id: '94', majorId: '18', name: '사무동 2층 타설', status: 'WAITING', memo: null, isToday: false, displayOrder: 2 },
    { id: '95', majorId: '18', name: '공장부지 타설', status: 'IN_PROGRESS', memo: null, isToday: false, displayOrder: 3 }
];

const REPORT_ITEMS = [
    { id: '1', reportId: '1', minorProcessId: '13', nameSnapshot: '먹매김', memoSnapshot: '3층 옥상', statusSnapshot: 'DONE', displayOrder: 1, majorName: null },
    { id: '2', reportId: '1', minorProcessId: '14', nameSnapshot: '기초철근 배근', memoSnapshot: '우측 끝 잔손 조금남음', statusSnapshot: 'DONE', displayOrder: 2, majorName: '기초공사' },
    { id: '3', reportId: '1', minorProcessId: '40', nameSnapshot: '화장실 방수', memoSnapshot: '김반장 불러서 진행', statusSnapshot: 'TOUCH_UP', displayOrder: 3, majorName: '방수공사' },
    { id: '4', reportId: '1', minorProcessId: '92', nameSnapshot: '2층 쓰레기 모음', memoSnapshot: '혁준 불러서 청소', statusSnapshot: 'WAITING', displayOrder: 4, majorName: '쓰레기 배출' },
    { id: '5', reportId: '1', minorProcessId: '12', nameSnapshot: '버림콘크리트 타설', memoSnapshot: null, statusSnapshot: 'DONE', displayOrder: 5, majorName: '기초공사' },
    { id: '6', reportId: '1', minorProcessId: '22', nameSnapshot: 'H빔 보 설치', memoSnapshot: null, statusSnapshot: 'IN_PROGRESS', displayOrder: 6, majorName: '철골공사' },
    { id: '7', reportId: '1', minorProcessId: '95', nameSnapshot: '공장부지 타설', memoSnapshot: null, statusSnapshot: 'IN_PROGRESS', displayOrder: 7, majorName: '타설' },
    { id: '8', reportId: '1', minorProcessId: '19', nameSnapshot: '앵커볼트 매립', memoSnapshot: null, statusSnapshot: 'TOUCH_UP', displayOrder: 8, majorName: '철골공사' },
    { id: '9', reportId: '1', minorProcessId: '21', nameSnapshot: 'H빔 기둥 세우기', memoSnapshot: null, statusSnapshot: 'DONE', displayOrder: 8, majorName: '철골공사' },
    { id: '10', reportId: '1', minorProcessId: '20', nameSnapshot: '철골 반입 검수', memoSnapshot: null, statusSnapshot: 'TOUCH_UP', displayOrder: 10, majorName: '철골공사' }
];

export async function seedUserData() {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
        throw new Error('데이터 복원을 위해 먼저 회원가입 및 로그인을 완료해주세요.');
    }

    const batch = writeBatch(db);
    const projectId = '1';

    // 1. 프로젝트 복원 
    const projectRef = doc(db, 'projects', projectId);
    batch.set(projectRef, {
        name: '에이치에이엔테크 (주)',
        address: '김해시 대동산단3로 120',
        startDate: '2025-02-02',
        endDate: '2026-08-20',
        ownerId: userId,
        createdAt: '2026-02-22T13:04:27.000Z'
    });

    // 2. 대공정 복원
    for (const major of USER_MAJORS) {
        const majorRef = doc(db, `projects/${projectId}/major_processes`, major.id);
        batch.set(majorRef, {
            name: major.name,
            displayOrder: major.displayOrder,
            createdAt: new Date().toISOString()
        });
    }

    // 3. 소공정 복원
    for (const minor of USER_MINORS) {
        const minorRef = doc(db, `projects/${projectId}/minor_processes`, minor.id);
        batch.set(minorRef, {
            majorId: minor.majorId,
            name: minor.name,
            status: minor.status,
            memo: minor.memo || '',
            isToday: minor.isToday,
            displayOrder: minor.displayOrder,
            createdAt: new Date().toISOString()
        });
    }

    // 4. 리포트 복원
    const reportId = '1';
    const reportRef = doc(db, `projects/${projectId}/reports`, reportId);
    batch.set(reportRef, {
        reportDate: '2026-02-22',
        weather: '맑음',
        authorName: useAuthStore.getState().name || '담당자',
        additionalMemo: '도면 수정',
        createdAt: '2026-02-22T18:48:24.000Z'
    });

    // 5. 리포트 아이템 복원
    for (const item of REPORT_ITEMS) {
        const itemRef = doc(db, `projects/${projectId}/reports/${reportId}/items`, item.id);
        batch.set(itemRef, {
            minorProcessId: item.minorProcessId,
            minorProcessName: item.nameSnapshot,
            majorProcessName: item.majorName || '',
            statusSnapshot: item.statusSnapshot,
            memo: item.memoSnapshot || ''
        });
    }

    await batch.commit();
}
