import React, { useState } from 'react';
import BottomNav from '../../components/layout/BottomNav';
import * as S from './Directory.style';

// 목 데이터 설정 (API 연동 전 하드코딩)
const MOCK_CONTRACTORS = [
    { id: 1, name: '노광수', specialty: '도배', location: '부산/경남', desc: '경력 20년, 꼼꼼한 마감' },
    { id: 2, name: '김목수', specialty: '목공', location: '부산/경남', desc: '천장, 가벽, 몰딩 전문' },
    { id: 3, name: '이타일', specialty: '타일', location: '부산/경남', desc: '주방, 욕실 트렌디한 타일 시공' },
    { id: 4, name: '박설비', specialty: '설비', location: '부산/경남', desc: '누수 탐지 및 배관 공사' },
    { id: 5, name: '최전기', specialty: '전기', location: '부산/경남', desc: '안전한 배선 및 조명 설치' },
    { id: 6, name: '정철거', specialty: '철거', location: '부산/경남', desc: '신속하고 깔끔한 철거 및 폐기물' },
];

export default function Directory() {
    const [selectedContractor, setSelectedContractor] = useState(null);

    // 모달 닫기 핸들러
    const handleCloseModal = () => setSelectedContractor(null);

    return (
        <S.Page>
            <S.Header>
                <S.HeaderTitle>인테리어</S.HeaderTitle>
                <S.SubTitle>부산/경남 📍</S.SubTitle>
            </S.Header>

            <S.ListContainer>
                {MOCK_CONTRACTORS.map((item) => (
                    <S.ListItem key={item.id} data-qa={`directory-item-${item.id}`}>
                        {/* 임시 프로필 이미지 대신 회색 원형 아바타 */}
                        <S.ProfileThumb>🧑</S.ProfileThumb>

                        <S.InfoArea onClick={() => setSelectedContractor(item)}>
                            <S.InfoTopRow>
                                <S.Name>{item.name}</S.Name>
                                <S.Specialty>{item.specialty}</S.Specialty>
                            </S.InfoTopRow>
                            <S.Description>{item.desc}</S.Description>
                        </S.InfoArea>

                        <S.ActionArea>
                            <S.ActionBtn title="메시지" onClick={() => alert(`${item.name}님에게 문자 전송`)}>✉️</S.ActionBtn>
                            <S.ActionBtn title="사진 공유" onClick={() => alert(`${item.name}님에게 사진 전송`)}>📷</S.ActionBtn>
                            <S.ActionBtn title="전화 걸기" onClick={() => alert(`${item.name}님에게 전화 걸기`)}>📞</S.ActionBtn>
                        </S.ActionArea>
                    </S.ListItem>
                ))}
            </S.ListContainer>

            {/* 공간 확보용 */}
            <div style={{ height: '80px' }} />

            <BottomNav />

            {/* 선택 시 보여지는 임시 안내 모달 */}
            {selectedContractor && (
                <S.Overlay onClick={handleCloseModal}>
                    <S.Modal onClick={(e) => e.stopPropagation()}>
                        <S.ModalTitle>{selectedContractor.name} ({selectedContractor.specialty})</S.ModalTitle>
                        <S.ModalText>
                            상세 정보 페이지는 준비 중입니다.<br />
                            현재는 껍데기만 구현되어 있습니다.
                        </S.ModalText>
                        <S.ModalCloseBtn onClick={handleCloseModal}>닫기</S.ModalCloseBtn>
                    </S.Modal>
                </S.Overlay>
            )}
        </S.Page>
    );
}
