import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';

const TEMPLATES_JA = [
    {
        id: '1_ja',
        name: 'OO工場 (サンプル)',
        isDefault: true,
        lang: 'ja',
        majors: [
            {
                name: '仮設工事', displayOrder: 1, minors: [
                    { name: '仮囲い設置', displayOrder: 1 },
                    { name: '現場事務所設置', displayOrder: 2 },
                    { name: '仮設電気引込', displayOrder: 3 },
                    { name: '仮設用水引込', displayOrder: 4 },
                    { name: '仮設トイレ設置', displayOrder: 5 },
                    { name: '安全施設設置', displayOrder: 6 }
                ]
            },
            {
                name: '土工事', displayOrder: 2, minors: [
                    { name: '根切り', displayOrder: 1 },
                    { name: '残土処理', displayOrder: 2 },
                    { name: '埋め戻し', displayOrder: 3 },
                    { name: '整地作業', displayOrder: 4 },
                    { name: '地盤締固め', displayOrder: 5 }
                ]
            },
            {
                name: '基礎工事', displayOrder: 3, minors: [
                    { name: '捨てコン打設', displayOrder: 1 },
                    { name: '墨出し', displayOrder: 2 },
                    { name: '基礎配筋', displayOrder: 3 },
                    { name: '基礎型枠設置', displayOrder: 4 },
                    { name: '基礎コンクリート打設', displayOrder: 5 },
                    { name: '基礎養生', displayOrder: 6 },
                    { name: '基礎型枠解体', displayOrder: 7 }
                ]
            },
            {
                name: '鉄骨工事', displayOrder: 4, minors: [
                    { name: 'アンカーボルト埋込', displayOrder: 1 },
                    { name: '鉄骨搬入検수', displayOrder: 2 },
                    { name: '柱建方', displayOrder: 3 },
                    { name: '梁取付け', displayOrder: 4 },
                    { name: 'ブレース付け', displayOrder: 5 },
                    { name: '高力ボルト締付け', displayOrder: 6 },
                    { name: '溶接', displayOrder: 7 },
                    { name: '耐火被覆', displayOrder: 8 }
                ]
            },
            {
                name: '屋根・外壁工事', displayOrder: 5, minors: [
                    { name: '屋根デッキプレート', displayOrder: 1 },
                    { name: '屋根断熱材施工', displayOrder: 2 },
                    { name: '屋根パネル設置', displayOrder: 3 },
                    { name: '樋・水切り設置', displayOrder: 4 },
                    { name: '外壁胴縁設置', displayOrder: 5 },
                    { name: '外壁断熱材施工', displayOrder: 6 },
                    { name: '外壁パネル設置', displayOrder: 7 }
                ]
            },
            {
                name: '床工事', displayOrder: 6, minors: [
                    { name: '防湿シート敷き', displayOrder: 1 },
                    { name: 'ワイヤーメッシュ敷き', displayOrder: 2 },
                    { name: '床コンクリート打設', displayOrder: 3 },
                    { name: '床養生', displayOrder: 4 },
                    { name: '表面硬化剤施工', displayOrder: 5 },
                    { name: '目地切り作業', displayOrder: 6 }
                ]
            }
        ]
    }
];

export async function seedTemplatesJa() {
    const batch = writeBatch(db);
    for (const templateData of TEMPLATES_JA) {
        const tRef = doc(collection(db, 'templates'), templateData.id);
        batch.set(tRef, {
            name: templateData.name,
            isDefault: templateData.isDefault,
            lang: templateData.lang,
            createdAt: new Date().toISOString()
        });
        for (const major of templateData.majors) {
            const mRef = doc(collection(db, `templates/${templateData.id}/template_major_processes`));
            batch.set(mRef, { name: major.name, displayOrder: major.displayOrder });
            for (const minor of major.minors) {
                const minorRef = doc(collection(db, `templates/${templateData.id}/template_major_processes/${mRef.id}/template_minor_processes`));
                batch.set(minorRef, { name: minor.name, displayOrder: minor.displayOrder });
            }
        }
    }
    await batch.commit();
}
