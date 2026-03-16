import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const NAVY = '#1A237E';

// 지도 기본값 — 서울 중심
const DEFAULT_REGION = {
  latitude: 37.5665,
  longitude: 126.9780,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * 위치 선택 모달 — GPS 현재 위치 or 지도 탭/드래그로 좌표 지정
 *
 * Props:
 *   visible      {boolean}
 *   initialLat   {number|null}  — 이전에 저장된 위도
 *   initialLng   {number|null}  — 이전에 저장된 경도
 *   onConfirm    {({ lat, lng, address }) => void}
 *   onClose      {() => void}
 */
export default function LocationPickerModal({
  visible, initialLat, initialLng, onConfirm, onClose,
}) {
  const mapRef = useRef(null);

  // 마커 위치 — 처음 열릴 때 이전 좌표가 있으면 세팅
  const [marker, setMarker] = useState(
    initialLat && initialLng
      ? { latitude: initialLat, longitude: initialLng }
      : null,
  );

  // 역지오코딩 결과 주소 (참고용 — 없어도 좌표로 저장 가능)
  const [reversedAddress, setReversedAddress] = useState('');
  const [reversing, setReversing] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const initialRegion = (initialLat && initialLng)
    ? { latitude: initialLat, longitude: initialLng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : DEFAULT_REGION;

  /* ── 좌표 → 주소 역지오코딩 (Nominatim) ── */
  const reverseGeocode = async (lat, lng) => {
    setReversing(true);
    setReversedAddress('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
        { headers: { 'User-Agent': 'BPR-BuilderApp/1.0' } },
      );
      const data = await res.json();
      if (data?.address) {
        const { province, city, county, city_district, suburb, road, village } = data.address;
        // 한국 주소 조합: 시/도 + 시/군/구 + 읍/면/동 + 도로명
        const parts = [
          province,
          city ?? county,
          city_district ?? suburb ?? village,
          road,
        ].filter(Boolean);
        setReversedAddress(parts.join(' ') || data.display_name?.split(',')[0] || '');
      }
    } catch {
      // 역지오코딩 실패해도 좌표는 유효 — 무시
    } finally {
      setReversing(false);
    }
  };

  /* ── 지도 탭 → 마커 이동 ── */
  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  /* ── GPS 현재 위치 ── */
  const handleGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 접근 권한이 필요합니다.\n설정 > 개인정보 보호에서 허용해주세요.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = loc.coords;
      const newMarker = { latitude, longitude };
      setMarker(newMarker);
      // 지도 애니메이션으로 현재 위치 이동
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 },
        600,
      );
      reverseGeocode(latitude, longitude);
    } catch (e) {
      Alert.alert('GPS 오류', e.message ?? 'GPS를 가져오지 못했습니다.');
    } finally {
      setGpsLoading(false);
    }
  };

  /* ── 확인 ── */
  const handleConfirm = () => {
    if (!marker) {
      Alert.alert('위치를 선택해주세요', '지도를 탭하거나 GPS 버튼을 눌러 위치를 지정하세요.');
      return;
    }
    onConfirm({
      lat: marker.latitude,
      lng: marker.longitude,
      // 역지오코딩 주소가 있으면 같이 저장 — 없으면 null (좌표만으로 날씨 가능)
      address: reversedAddress.trim() || null,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* 지도 — 탭으로 마커 찍기 */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          showsUserLocation       // 파란 점으로 현재 위치 표시
          showsMyLocationButton={false} // 커스텀 버튼 사용
        >
          {marker && (
            <Marker
              coordinate={marker}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setMarker({ latitude, longitude });
                reverseGeocode(latitude, longitude);
              }}
              pinColor={NAVY}
            />
          )}
        </MapView>

        {/* 닫기 버튼 (우상단) */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* 안내 배너 */}
        <View style={styles.hint}>
          <Text style={styles.hintText}>지도를 탭하거나 마커를 드래그해서 위치를 지정하세요</Text>
        </View>

        {/* 하단 패널 */}
        <View style={styles.panel}>
          {/* 역지오코딩 주소 표시 */}
          <View style={styles.addressRow}>
            {reversing ? (
              <ActivityIndicator size="small" color={NAVY} />
            ) : marker ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.coordText}>
                  {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
                </Text>
                {reversedAddress ? (
                  <Text style={styles.addressText} numberOfLines={1}>{reversedAddress}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.noLocationText}>위치를 선택해주세요</Text>
            )}
          </View>

          {/* GPS 버튼 + 확인 버튼 */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleGPS}
              disabled={gpsLoading}
            >
              {gpsLoading
                ? <ActivityIndicator size="small" color={NAVY} />
                : <Text style={styles.gpsBtnText}>📡 현재 위치</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, !marker && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!marker}
            >
              <Text style={styles.confirmBtnText}>이 위치 사용</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map:       { flex: 1 },

  closeBtn:  {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 16, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  hint: {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 16,
    left: 16, right: 60,
    backgroundColor: 'rgba(26,35,126,0.82)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    zIndex: 10,
  },
  hintText: { color: '#fff', fontSize: 12, fontWeight: '500' },

  panel: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },

  addressRow: {
    flexDirection: 'row', alignItems: 'center',
    minHeight: 40, marginBottom: 12,
  },
  coordText:     { fontSize: 13, color: '#1A237E', fontWeight: '700' },
  addressText:   { fontSize: 12, color: '#616161', marginTop: 2 },
  noLocationText:{ fontSize: 14, color: '#9E9E9E' },

  btnRow: { flexDirection: 'row', gap: 10 },
  gpsBtn: {
    flex: 1, backgroundColor: '#E8EAF6', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: '#C5CAE9', minHeight: 46,
  },
  gpsBtnText: { color: NAVY, fontSize: 14, fontWeight: '600' },

  confirmBtn: {
    flex: 2, backgroundColor: NAVY, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#9E9E9E' },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
