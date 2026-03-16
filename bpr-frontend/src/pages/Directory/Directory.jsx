import React, { useState, useEffect, useRef, useCallback } from 'react';
import BottomNav from '../../components/layout/BottomNav';
import * as S from './Directory.style';

/* ─────────────────────────────────────────────
   더미 업체 데이터 — 카테고리별 서울 권역 분포
   실제 서비스에서는 Firestore에서 불러옴
   ───────────────────────────────────────────── */
const MOCK_VENDORS = [
  { id: 1,  name: '한성인테리어',   category: '인테리어',   tags: ['도배', '장판'],      phone: '010-1111-2222', desc: '아파트·오피스텔 풀패키지 인테리어', lat: 37.5172, lng: 127.0473, emoji: '🏠' },
  { id: 2,  name: '삼호리모델링',   category: '인테리어',   tags: ['리모델링', '설계'],  phone: '010-2222-3333', desc: '10년 경력, 시공 후 AS 보장',        lat: 37.4979, lng: 127.0276, emoji: '🏠' },
  { id: 3,  name: 'KS철근',        category: '철근/철골',  tags: ['철근배근', '용접'],  phone: '010-3333-4444', desc: '기초·골조 철근 전문, 물량 협의 가능', lat: 37.5340, lng: 126.9907, emoji: '🔩' },
  { id: 4,  name: '동방철골',       category: '철근/철골',  tags: ['철골조립', 'H빔'],   phone: '010-4444-5555', desc: '상업시설 철골 구조물 시공',           lat: 37.5651, lng: 127.0714, emoji: '🔩' },
  { id: 5,  name: '강남레미콘',     category: '콘크리트',   tags: ['레미콘', '타설'],    phone: '010-5555-6666', desc: '즉시 출동, 소량 발주 가능',          lat: 37.4890, lng: 127.0616, emoji: '🧱' },
  { id: 6,  name: '한국콘크리트',   category: '콘크리트',   tags: ['그라우팅', '방수'],  phone: '010-6666-7777', desc: '균열 보수 및 바닥 평탄화 전문',       lat: 37.5543, lng: 126.9696, emoji: '🧱' },
  { id: 7,  name: '서울전기공사',   category: '전기',       tags: ['배선', '조명'],      phone: '010-7777-8888', desc: '전기 설계부터 AS까지 일괄 시공',     lat: 37.5800, lng: 127.0100, emoji: '⚡' },
  { id: 8,  name: '밝은전기',       category: '전기',       tags: ['분전함', '조명'],    phone: '010-8888-9999', desc: '상가·공장 전기 전문, 24시 출동',     lat: 37.5063, lng: 126.9586, emoji: '⚡' },
  { id: 9,  name: '청정설비',       category: '배관/설비',  tags: ['급배수', '누수'],    phone: '010-9999-0000', desc: '누수탐지 및 배관 교체 전문',          lat: 37.5220, lng: 127.0245, emoji: '🔧' },
  { id: 10, name: '한양설비',       category: '배관/설비',  tags: ['냉난방', '환기'],    phone: '010-1010-2020', desc: '에어컨·보일러 설치 및 수리',          lat: 37.5440, lng: 127.0560, emoji: '🔧' },
  { id: 11, name: '컬러도장',       category: '도장',       tags: ['내부도장', '외벽'],  phone: '010-2020-3030', desc: '친환경 페인트, 깔끔한 마감',          lat: 37.4720, lng: 127.0380, emoji: '🖌️' },
  { id: 12, name: '명장페인팅',     category: '도장',       tags: ['방화도장', '에폭시'], phone: '010-3030-4040', desc: '공장·창고 특수도장 전문',            lat: 37.5580, lng: 126.9400, emoji: '🖌️' },
  { id: 13, name: '목수왕',         category: '목공',       tags: ['천장', '가벽'],      phone: '010-4040-5050', desc: '가벽·몰딩·문짝 제작 및 시공',        lat: 37.5310, lng: 126.9230, emoji: '🪚' },
  { id: 14, name: '정밀목공',       category: '목공',       tags: ['마루', '데크'],      phone: '010-5050-6060', desc: '원목 마루·데크 전문, 광택 시공',     lat: 37.5720, lng: 127.0920, emoji: '🪚' },
  { id: 15, name: '방수달인',       category: '방수',       tags: ['옥상', '지하'],      phone: '010-6060-7070', desc: '옥상·지하주차장 방수 전문',           lat: 37.5030, lng: 127.0730, emoji: '💧' },
  { id: 16, name: '투명유리',       category: '유리/창호',  tags: ['창호', '강화유리'],  phone: '010-7070-8080', desc: '시스템창호·커튼월 시공',              lat: 37.4850, lng: 126.9810, emoji: '🪟' },
  { id: 17, name: '타일장인',       category: '타일',       tags: ['욕실', '주방'],      phone: '010-8080-9090', desc: '수입 타일·대형 슬라브 시공 전문',     lat: 37.5490, lng: 127.0840, emoji: '🔲' },
  { id: 18, name: '하이타일',       category: '타일',       tags: ['바닥', '포세린'],    phone: '010-9090-1010', desc: '상업시설 로비·계단 타일 시공',        lat: 37.5155, lng: 126.9640, emoji: '🔲' },
  { id: 19, name: '신속철거',       category: '철거',       tags: ['내부철거', '폐기물'], phone: '010-1020-3040', desc: '철거 후 폐기물 처리까지 원스톱',     lat: 37.5630, lng: 127.0250, emoji: '⛏️' },
  { id: 20, name: '한방철거',       category: '철거',       tags: ['구조체', '석면'],    phone: '010-2030-4050', desc: '석면 제거 허가업체, 안전 시공',       lat: 37.5380, lng: 126.9520, emoji: '⛏️' },
];

const CATEGORIES = ['전체', '인테리어', '철근/철골', '콘크리트', '전기', '배관/설비', '도장', '목공', '방수', '유리/창호', '타일', '철거'];
const CATEGORY_EMOJI = { '인테리어':'🏠','철근/철골':'🔩','콘크리트':'🧱','전기':'⚡','배관/설비':'🔧','도장':'🖌️','목공':'🪚','방수':'💧','유리/창호':'🪟','타일':'🔲','철거':'⛏️' };

/* Haversine 공식 — 두 좌표 간 거리(km) 계산 */
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* 거리 포맷: 1km 미만이면 m 단위 */
function formatDist(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export default function Directory() {
  const [category, setCategory] = useState('전체');
  const [myPos, setMyPos] = useState(null); /* { lat, lng } */
  const [geoError, setGeoError] = useState(false);
  const [copied, setCopied] = useState(null); /* 복사된 업체 id */
  const [registerOpen, setRegisterOpen] = useState(false); /* 등록 시트 표시 여부 */
  const [form, setForm] = useState({ name: '', category: '인테리어', tags: '', phone: '', desc: '', photo: null, address: '' });
  const [extraVendors, setExtraVendors] = useState([]); /* 사용자가 직접 등록한 업체 */
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [search, setSearch] = useState(''); /* 검색어 */
  const [hiddenIds, setHiddenIds] = useState(new Set()); /* 숨긴 업체 ID 집합 */
  const [showHidden, setShowHidden] = useState(false); /* 숨긴 업체만 보기 토글 */
  const scrollRef = useRef(null);

  /* 스크롤 위치 감지 — 양방향 버튼 표시 여부 */
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleScrollLeft  = () => scrollRef.current?.scrollBy({ left: -120, behavior: 'smooth' });
  const handleScrollRight = () => scrollRef.current?.scrollBy({ left:  120, behavior: 'smooth' });

  /* 현재 위치 요청 */
  useEffect(() => {
    if (!navigator.geolocation) { setGeoError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError(true),
      { timeout: 8000 },
    );
  }, []);

  /* 주소 → 좌표 변환 (Kakao REST API) */
  const geocodeAddress = async (address) => {
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        { headers: { Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_REST_KEY}` } },
      );
      const data = await res.json();
      const doc = data.documents?.[0];
      if (doc) return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
    } catch (_) { /* 지오코딩 실패 시 현재 위치 사용 */ }
    return null;
  };

  /* 등록 양식 제출 — 주소로 좌표 변환, 실패 시 현재 위치 */
  const handleRegister = async (e) => {
    e.preventDefault();
    /* 주소 입력이 있으면 지오코딩 시도 */
    let coords = null;
    if (form.address.trim()) {
      coords = await geocodeAddress(form.address.trim());
    }
    const newVendor = {
      id: Date.now(),
      name: form.name,
      category: form.category,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      phone: form.phone,
      desc: form.desc,
      photo: form.photo,
      address: form.address,
      lat: coords?.lat ?? myPos?.lat ?? 37.5172,
      lng: coords?.lng ?? myPos?.lng ?? 127.0473,
      emoji: CATEGORY_EMOJI[form.category] ?? '🏢',
    };
    setExtraVendors((prev) => [newVendor, ...prev]);
    setForm({ name: '', category: '인테리어', tags: '', phone: '', desc: '', photo: null, address: '' });
    setRegisterOpen(false);
  };

  /* 사진 선택 → data URL 변환 */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  /* 업체 숨기기 / 숨기기 해제 */
  const handleHide   = (id) => setHiddenIds((prev) => new Set([...prev, id]));
  const handleUnhide = (id) => setHiddenIds((prev) => { const n = new Set(prev); n.delete(id); return n; });

  /* 카테고리 필터 + 검색 + 거리 정렬 + 숨김 처리 */
  const q = search.trim().toLowerCase();
  const vendors = [...MOCK_VENDORS, ...extraVendors]
    .filter((v) => showHidden ? hiddenIds.has(v.id) : !hiddenIds.has(v.id))
    .filter((v) => category === '전체' || v.category === category)
    .filter((v) => !q || v.name.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q) || v.tags.some((t) => t.toLowerCase().includes(q)))
    .map((v) => ({
      ...v,
      distKm: myPos ? getDistanceKm(myPos.lat, myPos.lng, v.lat, v.lng) : null,
    }))
    .sort((a, b) => {
      /* 위치 허용된 경우 거리순, 아니면 원래 순서 */
      if (a.distKm !== null && b.distKm !== null) return a.distKm - b.distKm;
      return a.id - b.id;
    });

  /* 정보복사 — 업체명 + 전화번호 + 전문분야 */
  const handleCopy = (vendor) => {
    const text = `[${vendor.category}] ${vendor.name}\n전화: ${vendor.phone}\n전문: ${vendor.tags.join(', ')}\n${vendor.desc}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(vendor.id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <S.Page data-qa="directory-page">
      <S.Header data-qa="directory-header">
        <S.HeaderRow>
          <S.HeaderTitle>업체 찾기</S.HeaderTitle>
          <S.LocationBadge>
            {geoError ? '📍 위치 허용 필요' : myPos ? '📍 내 위치 기준' : '📍 위치 확인 중…'}
          </S.LocationBadge>
        </S.HeaderRow>
        <S.HeaderSub>출장지 주변 전문 업체를 바로 확인하세요.</S.HeaderSub>

        {/* 검색바 */}
        <S.SearchInput
          data-qa="directory-search"
          placeholder="업체명, 전문분야 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* 카테고리 필터 칩 + < > 스크롤 버튼 */}
        <S.CategoryWrapper>
          {canScrollLeft && (
            <S.ScrollMoreBtn $left onClick={handleScrollLeft} title="이전">‹</S.ScrollMoreBtn>
          )}
          <S.CategoryScroll ref={scrollRef} data-qa="directory-category-scroll">
            {CATEGORIES.map((cat) => (
              <S.CategoryChip
                key={cat}
                $active={category === cat}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </S.CategoryChip>
            ))}
          </S.CategoryScroll>
          {canScrollRight && (
            <S.ScrollMoreBtn onClick={handleScrollRight} title="더 보기">›</S.ScrollMoreBtn>
          )}
        </S.CategoryWrapper>
      </S.Header>

      <S.ListContainer data-qa="directory-list">
        {vendors.map((vendor) => (
          <S.ListItem key={vendor.id} data-qa={`directory-item-${vendor.id}`}>
            {/* 이모지/사진 영역 + 호버 시 액션 버튼 오버레이 */}
            <S.Avatar>
              {vendor.photo
                ? <img src={vendor.photo} alt={vendor.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                : vendor.emoji}
              {vendor.distKm !== null && (
                <S.DistBadge>{formatDist(vendor.distKm)}</S.DistBadge>
              )}
              {/* 좌측 상단 숨기기/해제 X 버튼 */}
              {showHidden ? (
                <S.HideBtn data-qa="directory-hide-btn" title="숨기기 해제" onClick={(e) => { e.stopPropagation(); handleUnhide(vendor.id); }}>↩</S.HideBtn>
              ) : (
                <S.HideBtn data-qa="directory-hide-btn" title="숨기기" onClick={(e) => { e.stopPropagation(); handleHide(vendor.id); }}>✕</S.HideBtn>
              )}

              {/* 호버 시 등장하는 원형 버튼 오버레이 */}
              <S.ActionArea data-qa="directory-actions">
                <S.ActionBtn
                  as="a"
                  href={`tel:${vendor.phone}`}
                  title="전화"
                  $color="#293553"
                  onClick={(e) => e.stopPropagation()}
                >
                  📞
                </S.ActionBtn>
                <S.ActionBtn
                  as="a"
                  href={`sms:${vendor.phone}`}
                  title="문자"
                  $color="#1565C0"
                  onClick={(e) => e.stopPropagation()}
                >
                  💬
                </S.ActionBtn>
                <S.ActionBtn
                  title={copied === vendor.id ? '복사됨!' : '정보복사'}
                  $color={copied === vendor.id ? '#388e3c' : '#555'}
                  onClick={(e) => { e.stopPropagation(); handleCopy(vendor); }}
                >
                  {copied === vendor.id ? '✅' : '📋'}
                </S.ActionBtn>
              </S.ActionArea>
            </S.Avatar>

            {/* 업체 정보 */}
            <S.InfoArea>
              <S.InfoTopRow>
                <S.VendorName>{vendor.name}</S.VendorName>
                <S.CategoryTag>{vendor.category}</S.CategoryTag>
              </S.InfoTopRow>
              <S.TagRow>
                {vendor.tags.map((tag) => (
                  <S.TagChip key={tag}>{tag}</S.TagChip>
                ))}
              </S.TagRow>
              <S.Desc>{vendor.desc}</S.Desc>
            </S.InfoArea>

            {/* 이름 하단 바 */}
            <S.NameBar>{vendor.name}</S.NameBar>
          </S.ListItem>
        ))}
      </S.ListContainer>

      {/* 우측 하단 FAB 그룹 */}
      <S.FabGroup>
        <S.RegisterFab data-qa="directory-register-fab" onClick={() => setRegisterOpen(true)}>
          + 업체등록
        </S.RegisterFab>
        <S.HiddenFab
          data-qa="directory-hidden-fab"
          $active={showHidden}
          onClick={() => setShowHidden((v) => !v)}
        >
          {showHidden ? '← 이전으로 돌아가기' : `숨긴 업체 보기 (${hiddenIds.size})`}
        </S.HiddenFab>
      </S.FabGroup>

      <BottomNav />

      {/* 업체 등록 바텀 시트 */}
      {registerOpen && (
        <S.SheetOverlay onClick={() => setRegisterOpen(false)}>
          <S.Sheet onClick={(e) => e.stopPropagation()}>
            <S.SheetTitleRow>
              <S.SheetTitle>업체 등록</S.SheetTitle>
              <S.SheetCloseBtn onClick={() => setRegisterOpen(false)} title="닫기">✕</S.SheetCloseBtn>
            </S.SheetTitleRow>
            <S.RegisterForm onSubmit={handleRegister}>
              <S.FormLabel>업체명 *</S.FormLabel>
              <S.FormInput
                placeholder="예: 한성인테리어"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />

              <S.FormLabel>카테고리 *</S.FormLabel>
              <S.FormSelect
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.filter((c) => c !== '전체').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </S.FormSelect>

              <S.FormLabel>업체 주소 *</S.FormLabel>
              <S.FormInput
                placeholder="예: 서울 강남구 테헤란로 123"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                required
              />

              <S.FormLabel>전문분야 (쉼표로 구분)</S.FormLabel>
              <S.FormInput
                placeholder="예: 도배, 장판, 마루"
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              />

              <S.FormLabel>전화번호 *</S.FormLabel>
              <S.FormInput
                type="tel"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
              />

              <S.FormLabel>소개</S.FormLabel>
              <S.FormInput
                placeholder="간단한 소개를 입력하세요"
                value={form.desc}
                onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
              />

              <S.FormLabel>사진 (선택)</S.FormLabel>
              <S.PhotoUploadLabel>
                {form.photo
                  ? <><S.PhotoPreview src={form.photo} alt="미리보기" /><span>사진 변경하기</span></>
                  : <span>📷 사진을 추가하세요</span>
                }
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
              </S.PhotoUploadLabel>

              <S.FormNote>
                📍 입력한 주소로 거리가 계산됩니다.{!form.address && myPos && ' (주소 없으면 현재 위치 사용)'}
              </S.FormNote>

              <S.FormSubmitBtn type="submit">등록하기</S.FormSubmitBtn>
            </S.RegisterForm>
          </S.Sheet>
        </S.SheetOverlay>
      )}
    </S.Page>
  );
}
