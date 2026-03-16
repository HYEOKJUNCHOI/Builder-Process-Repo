import { useState, useEffect } from 'react';

/** WMO 날씨 코드 → 한국어 텍스트 + 이모지 */
const WMO_MAP = {
  0:  { text: '맑음',      emoji: '☀️' },
  1:  { text: '대체로 맑음', emoji: '🌤️' },
  2:  { text: '구름 많음',  emoji: '⛅' },
  3:  { text: '흐림',      emoji: '☁️' },
  45: { text: '안개',      emoji: '🌫️' },
  48: { text: '안개',      emoji: '🌫️' },
  51: { text: '이슬비',    emoji: '🌦️' },
  53: { text: '이슬비',    emoji: '🌦️' },
  55: { text: '이슬비',    emoji: '🌦️' },
  61: { text: '비',        emoji: '🌧️' },
  63: { text: '비',        emoji: '🌧️' },
  65: { text: '강한 비',   emoji: '🌧️' },
  71: { text: '눈',        emoji: '❄️' },
  73: { text: '눈',        emoji: '❄️' },
  75: { text: '강한 눈',   emoji: '❄️' },
  80: { text: '소나기',    emoji: '🌦️' },
  81: { text: '소나기',    emoji: '🌦️' },
  82: { text: '강한 소나기', emoji: '🌦️' },
  95: { text: '천둥번개',  emoji: '⛈️' },
  96: { text: '우박',      emoji: '⛈️' },
  99: { text: '우박',      emoji: '⛈️' },
};

function getWeatherInfo(code) {
  return WMO_MAP[code] ?? { text: '알 수 없음', emoji: '🌡️' };
}

/**
 * 현장 위치 기반 날씨 훅 (모바일 버전)
 *
 * 인자 형식 (두 가지 모두 지원):
 *   - string: 주소 문자열 (하위 호환 유지)
 *   - { address?, lat?, lng? }: 좌표가 있으면 geocoding 스킵하고 Open-Meteo 직접 호출
 *
 * 우선순위: lat/lng > address (좌표 > 주소)
 */
export function useWeather(input) {
  // 문자열이면 { address } 형태로 정규화 — 하위 호환
  const { address = null, lat: rawLat = null, lng: rawLng = null } =
    typeof input === 'string' ? { address: input } : (input ?? {});

  const [weather, setWeather] = useState(null);
  const [tomorrow, setTomorrow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hasCoords = rawLat != null && rawLng != null;
    const hasAddress = !!address?.trim();

    // 좌표도 주소도 없으면 날씨 미표시
    if (!hasCoords && !hasAddress) {
      setWeather(null);
      setTomorrow(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchByCoords = async (lat, lon) => {
      // Open-Meteo — 현재 날씨 + 내일 예보 + 강수확률
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=Asia%2FSeoul&forecast_days=2`,
      );
      if (!weatherRes.ok) throw new Error('날씨 API 오류');
      const wd = await weatherRes.json();

      const { weathercode, temperature } = wd.current_weather;
      const info = getWeatherInfo(weathercode);
      const daily = wd.daily;
      const todayRain = daily.precipitation_probability_max?.[0] ?? 0;

      const tomorrowInfo = getWeatherInfo(daily.weathercode[1]);
      const tempMax = daily.temperature_2m_max?.[1];
      const tempMin = daily.temperature_2m_min?.[1];
      const tomorrowData = (tempMax != null && tempMin != null) ? {
        ...tomorrowInfo,
        tempMax: Math.round(tempMax),
        tempMin: Math.round(tempMin),
        rain: daily.precipitation_probability_max?.[1] ?? 0,
      } : null;

      if (!cancelled) {
        setWeather({ ...info, temp: Math.round(temperature), rain: todayRain });
        setTomorrow(tomorrowData);
      }
    };

    const fetchWeather = async () => {
      try {
        if (hasCoords) {
          // ✅ 좌표 직접 사용 — geocoding 스킵 (건축 현장 미등록 주소 대응)
          await fetchByCoords(rawLat, rawLng);
        } else {
          // ① Nominatim geocoding — 주소 → 위도/경도
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address.trim())}&format=json&limit=1`,
            { headers: { 'User-Agent': 'BPR-BuilderApp/1.0' } },
          );
          const geoData = await geoRes.json();
          if (!geoData.length) throw new Error('주소를 찾을 수 없습니다.');
          await fetchByCoords(geoData[0].lat, geoData[0].lon);
        }
      } catch (e) {
        if (!cancelled) setError(e.message ?? '날씨를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWeather();
    return () => { cancelled = true; };
  }, [address, rawLat, rawLng]);

  return { weather, tomorrow, loading, error };
}
