import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';

const TEMPLATES = [
    {
        id: '1',
        name: '공장동 (철골조 H빔)',
        isDefault: true,
        majors: [
            {
                name: '가설공사', displayOrder: 1, minors: [
                    { name: '가설울타리 설치', displayOrder: 1 },
                    { name: '현장사무소 설치', displayOrder: 2 },
                    { name: '가설전기 인입', displayOrder: 3 },
                    { name: '가설용수 인입', displayOrder: 4 },
                    { name: '가설화장실 설치', displayOrder: 5 },
                    { name: '안전시설물 설치', displayOrder: 6 }
                ]
            },
            {
                name: '토공사', displayOrder: 2, minors: [
                    { name: '터파기', displayOrder: 1 },
                    { name: '잔토 처리', displayOrder: 2 },
                    { name: '되메우기', displayOrder: 3 },
                    { name: '정지작업', displayOrder: 4 },
                    { name: '지반다짐', displayOrder: 5 }
                ]
            },
            {
                name: '기초공사', displayOrder: 3, minors: [
                    { name: '버림콘크리트 타설', displayOrder: 1 },
                    { name: '먹매김', displayOrder: 2 },
                    { name: '기초철근 배근', displayOrder: 3 },
                    { name: '기초거푸집 설치', displayOrder: 4 },
                    { name: '기초콘크리트 타설', displayOrder: 5 },
                    { name: '기초양생', displayOrder: 6 },
                    { name: '기초거푸집 해체', displayOrder: 7 }
                ]
            },
            {
                name: '철골공사', displayOrder: 4, minors: [
                    { name: '앵커볼트 매립', displayOrder: 1 },
                    { name: '철골 반입 검수', displayOrder: 2 },
                    { name: 'H빔 기둥 세우기', displayOrder: 3 },
                    { name: 'H빔 보 설치', displayOrder: 4 },
                    { name: '브레이싱 설치', displayOrder: 5 },
                    { name: '고력볼트 체결', displayOrder: 6 },
                    { name: '용접', displayOrder: 7 },
                    { name: '내화피복', displayOrder: 8 }
                ]
            },
            {
                name: '지붕·외벽공사', displayOrder: 5, minors: [
                    { name: '지붕 데크플레이트 설치', displayOrder: 1 },
                    { name: '지붕 단열재 시공', displayOrder: 2 },
                    { name: '지붕 판넬 설치', displayOrder: 3 },
                    { name: '홈통·물끊기 설치', displayOrder: 4 },
                    { name: '외벽 철골 가트 설치', displayOrder: 5 },
                    { name: '외벽 단열재 시공', displayOrder: 6 },
                    { name: '외벽 판넬 설치', displayOrder: 7 }
                ]
            },
            {
                name: '바닥공사', displayOrder: 6, minors: [
                    { name: '방습비닐 깔기', displayOrder: 1 },
                    { name: '와이어메쉬 설치', displayOrder: 2 },
                    { name: '바닥콘크리트 타설', displayOrder: 3 },
                    { name: '바닥양생', displayOrder: 4 },
                    { name: '표면경화제 시공', displayOrder: 5 },
                    { name: '바닥줄눈 시공', displayOrder: 6 }
                ]
            },
            {
                name: '창호공사', displayOrder: 7, minors: [
                    { name: '창호틀 설치', displayOrder: 1 },
                    { name: '유리 시공', displayOrder: 2 },
                    { name: '방화문 설치', displayOrder: 3 },
                    { name: '오버헤드도어 설치', displayOrder: 4 },
                    { name: '실란트·코킹', displayOrder: 5 }
                ]
            },
            {
                name: '전기공사', displayOrder: 8, minors: [
                    { name: '전기 인입 배관', displayOrder: 1 },
                    { name: '분전반 설치', displayOrder: 2 },
                    { name: '조명 배선', displayOrder: 3 },
                    { name: '콘센트 배선', displayOrder: 4 },
                    { name: '조명기구 설치', displayOrder: 5 },
                    { name: '접지공사', displayOrder: 6 },
                    { name: '수전 신청', displayOrder: 7 }
                ]
            },
            {
                name: '설비공사', displayOrder: 9, minors: [
                    { name: '급수배관', displayOrder: 1 },
                    { name: '오배수배관', displayOrder: 2 },
                    { name: '소방배관', displayOrder: 3 },
                    { name: '위생기구 설치', displayOrder: 4 },
                    { name: '환기팬 설치', displayOrder: 5 }
                ]
            },
            {
                name: '소방공사', displayOrder: 10, minors: [
                    { name: '소화배관 설치', displayOrder: 1 },
                    { name: '스프링클러 헤드 설치', displayOrder: 2 },
                    { name: '소화전 설치', displayOrder: 3 },
                    { name: '감지기 설치', displayOrder: 4 },
                    { name: '수신반 설치', displayOrder: 5 },
                    { name: '소방 준공검사', displayOrder: 6 }
                ]
            },
            {
                name: '외구공사', displayOrder: 11, minors: [
                    { name: '외부 토공 정지', displayOrder: 1 },
                    { name: '우수측구 설치', displayOrder: 2 },
                    { name: '아스콘 포장', displayOrder: 3 },
                    { name: '경계석 설치', displayOrder: 4 },
                    { name: '조경식재', displayOrder: 5 },
                    { name: '주차라인 도색', displayOrder: 6 }
                ]
            },
            {
                name: '준공정리', displayOrder: 12, minors: [
                    { name: '자재 정리·반출', displayOrder: 1 },
                    { name: '가설물 철거', displayOrder: 2 },
                    { name: '준공청소', displayOrder: 3 },
                    { name: '관공서 검사', displayOrder: 4 },
                    { name: '준공서류 제출', displayOrder: 5 },
                    { name: '하자보수 점검', displayOrder: 6 }
                ]
            }
        ]
    },
    {
        id: '2',
        name: '사무동 (철골조 H빔)',
        isDefault: true,
        majors: [
            {
                name: '가설공사', displayOrder: 1, minors: [
                    { name: '가설울타리 설치', displayOrder: 1 },
                    { name: '현장사무소 설치', displayOrder: 2 },
                    { name: '가설전기 인입', displayOrder: 3 },
                    { name: '가설용수 인입', displayOrder: 4 },
                    { name: '가설화장실 설치', displayOrder: 5 },
                    { name: '안전시설물 설치', displayOrder: 6 }
                ]
            },
            {
                name: '토공사', displayOrder: 2, minors: [
                    { name: '터파기', displayOrder: 1 },
                    { name: '잔토 처리', displayOrder: 2 },
                    { name: '되메우기', displayOrder: 3 },
                    { name: '정지작업', displayOrder: 4 },
                    { name: '지반다짐', displayOrder: 5 }
                ]
            },
            {
                name: '기초공사', displayOrder: 3, minors: [
                    { name: '버림콘크리트 타설', displayOrder: 1 },
                    { name: '먹매김', displayOrder: 2 },
                    { name: '기초철근 배근', displayOrder: 3 },
                    { name: '기초거푸집 설치', displayOrder: 4 },
                    { name: '기초콘크리트 타설', displayOrder: 5 },
                    { name: '기초양생', displayOrder: 6 },
                    { name: '기초거푸집 해체', displayOrder: 7 }
                ]
            },
            {
                name: '철골공사', displayOrder: 4, minors: [
                    { name: '앵커볼트 매립', displayOrder: 1 },
                    { name: '철골 반입 검수', displayOrder: 2 },
                    { name: 'H빔 기둥 세우기', displayOrder: 3 },
                    { name: 'H빔 보 설치', displayOrder: 4 },
                    { name: '브레이싱 설치', displayOrder: 5 },
                    { name: '고력볼트 체결', displayOrder: 6 },
                    { name: '용접', displayOrder: 7 },
                    { name: '데크플레이트 설치', displayOrder: 8 },
                    { name: '내화피복', displayOrder: 9 }
                ]
            },
            {
                name: '슬래브공사', displayOrder: 5, minors: [
                    { name: '슬래브 철근 배근', displayOrder: 1 },
                    { name: '슬래브 거푸집 설치', displayOrder: 2 },
                    { name: '설비배관 선시공', displayOrder: 3 },
                    { name: '슬래브콘크리트 타설', displayOrder: 4 },
                    { name: '슬래브양생', displayOrder: 5 },
                    { name: '거푸집 해체', displayOrder: 6 }
                ]
            },
            {
                name: '조적·경량벽체공사', displayOrder: 6, minors: [
                    { name: '먹매김', displayOrder: 1 },
                    { name: '조적쌓기', displayOrder: 2 },
                    { name: '경량스터드 벽체 설치', displayOrder: 3 },
                    { name: '단열재 충진', displayOrder: 4 },
                    { name: '석고보드 시공', displayOrder: 5 }
                ]
            },
            {
                name: '방수공사', displayOrder: 7, minors: [
                    { name: '옥상 방수', displayOrder: 1 },
                    { name: '화장실 방수', displayOrder: 2 },
                    { name: '외벽 실란트', displayOrder: 3 }
                ]
            },
            {
                name: '창호공사', displayOrder: 8, minors: [
                    { name: '커튼월 프레임 설치', displayOrder: 1 },
                    { name: '유리 시공', displayOrder: 2 },
                    { name: '출입문 설치', displayOrder: 3 },
                    { name: '방화문 설치', displayOrder: 4 },
                    { name: '실란트·코킹', displayOrder: 5 }
                ]
            },
            {
                name: '내부마감공사', displayOrder: 9, minors: [
                    { name: '바닥 레벨링', displayOrder: 1 },
                    { name: '바닥재 시공', displayOrder: 2 },
                    { name: '벽체 퍼티·페인트', displayOrder: 3 },
                    { name: '천장 경량틀 설치', displayOrder: 4 },
                    { name: '천장 텍스타일 시공', displayOrder: 5 },
                    { name: '걸레받이 설치', displayOrder: 6 }
                ]
            },
            {
                name: '전기공사', displayOrder: 10, minors: [
                    { name: '전기 인입 배관', displayOrder: 1 },
                    { name: '분전반 설치', displayOrder: 2 },
                    { name: '조명 배선', displayOrder: 3 },
                    { name: '콘센트 배선', displayOrder: 4 },
                    { name: '통신 배선', displayOrder: 5 },
                    { name: '조명기구 설치', displayOrder: 6 },
                    { name: '접지공사', displayOrder: 7 },
                    { name: '수전 신청', displayOrder: 8 }
                ]
            },
            {
                name: '설비공사', displayOrder: 11, minors: [
                    { name: '급수배관', displayOrder: 1 },
                    { name: '오배수배관', displayOrder: 2 },
                    { name: '소방배관', displayOrder: 3 },
                    { name: '위생기구 설치', displayOrder: 4 },
                    { name: '에어컨 배관', displayOrder: 5 },
                    { name: '환기덕트 설치', displayOrder: 6 }
                ]
            },
            {
                name: '소방공사', displayOrder: 12, minors: [
                    { name: '소화배관 설치', displayOrder: 1 },
                    { name: '스프링클러 헤드 설치', displayOrder: 2 },
                    { name: '소화전 설치', displayOrder: 3 },
                    { name: '감지기 설치', displayOrder: 4 },
                    { name: '수신반 설치', displayOrder: 5 },
                    { name: '소방 준공검사', displayOrder: 6 }
                ]
            },
            {
                name: '승강기공사', displayOrder: 13, minors: [
                    { name: '승강기 피트 확인', displayOrder: 1 },
                    { name: '레일 설치', displayOrder: 2 },
                    { name: '승강기 본체 설치', displayOrder: 3 },
                    { name: '시운전', displayOrder: 4 },
                    { name: '승강기 검사', displayOrder: 5 }
                ]
            },
            {
                name: '외구공사', displayOrder: 14, minors: [
                    { name: '외부 토공 정지', displayOrder: 1 },
                    { name: '우수측구 설치', displayOrder: 2 },
                    { name: '아스콘 포장', displayOrder: 3 },
                    { name: '경계석 설치', displayOrder: 4 },
                    { name: '조경식재', displayOrder: 5 },
                    { name: '주차라인 도색', displayOrder: 6 }
                ]
            },
            {
                name: '준공정리', displayOrder: 15, minors: [
                    { name: '자재 정리·반출', displayOrder: 1 },
                    { name: '가설물 철거', displayOrder: 2 },
                    { name: '준공청소', displayOrder: 3 },
                    { name: '관공서 검사', displayOrder: 4 },
                    { name: '준공서류 제출', displayOrder: 5 },
                    { name: '하자보수 점검', displayOrder: 6 }
                ]
            }
        ]
    }
];

/**
 * 템플릿 데이터를 Firestore에 초기화(Seeding)합니다.
 * (개발자용 / 버튼 클릭 1회용)
 */
export async function seedTemplates() {
    const batch = writeBatch(db);

    for (const templateData of TEMPLATES) {
        // 1. Template 루트 생성
        const tRef = doc(collection(db, 'templates'), templateData.id);
        batch.set(tRef, {
            name: templateData.name,
            isDefault: templateData.isDefault,
            createdAt: new Date().toISOString()
        });

        // 2. 대공정 및 소공정 서브컬렉션으로 생성
        for (const major of templateData.majors) {
            const mRef = doc(collection(db, `templates/${templateData.id}/template_major_processes`));
            batch.set(mRef, {
                name: major.name,
                displayOrder: major.displayOrder
            });

            for (const minor of major.minors) {
                const minorRef = doc(collection(db, `templates/${templateData.id}/template_major_processes/${mRef.id}/template_minor_processes`));
                batch.set(minorRef, {
                    name: minor.name,
                    displayOrder: minor.displayOrder
                });
            }
        }
    }

    // 1개의 배치 커밋당 최대 500개 작업 지원
    // 이 스크립트의 데이터 양은 500개 미만이므로 1회 커밋으로 충분함.
    await batch.commit();
}
