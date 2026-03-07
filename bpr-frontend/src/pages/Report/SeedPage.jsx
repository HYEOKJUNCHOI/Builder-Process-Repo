import React, { useState } from 'react';
import { seedTemplates } from './seedTemplates';
import { seedUserData } from './seedUserData';
import useAuthStore from '../../store/authStore';

export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const [complete, setComplete] = useState(false);

    const handleSeed = async () => {
        try {
            setLoading(true);
            await seedTemplates();
            setComplete(true);
            alert('Firestore: 기본 템플릿(공장동, 사무동) 등록 완료!');
        } catch (err) {
            console.error(err);
            alert('에러 발생: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedUserData = async () => {
        const userId = useAuthStore.getState().userId;
        if (!userId) {
            alert('데이터 복원을 위해 먼저 회원가입 및 로그인을 완료해주세요.');
            return;
        }

        try {
            setLoading(true);
            await seedUserData();

            setComplete(true);
            alert('Firestore: 사용자 기존 현장 및 일지 데이터 복원 완료!');
        } catch (err) {
            console.error(err);
            alert('에러 발생: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>BPR Database Initializer</h1>
            <p>현재 빈 Firestore 데이터베이스에 공장동/사무동 초기 템플릿을 등록합니다.</p>

            {!complete ? (
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            fontSize: '18px',
                            background: '#ff5e00',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'wait' : 'pointer'
                        }}
                    >
                        {loading ? '등록 중...' : '1. 기본 템플릿 등록 시드 실행'}
                    </button>

                    <button
                        onClick={handleSeedUserData}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            fontSize: '18px',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'wait' : 'pointer'
                        }}
                    >
                        {loading ? '등록 중...' : '2. 내 현장 및 일지 데이터 복원'}
                    </button>
                </div>
            ) : (
                <div style={{ color: 'green', marginTop: '20px' }}>
                    <h3>✅ 초기화가 완료되었습니다.</h3>
                    <p>상단의 URL 주소를 원래대로 지우고 메인 대시보드로 돌아가시면 됩니다.</p>
                </div>
            )}
        </div>
    );
}
