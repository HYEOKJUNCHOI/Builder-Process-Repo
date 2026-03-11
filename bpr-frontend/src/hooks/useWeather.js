import { useState, useEffect } from 'react';

/**
 * WMO 날씨 코드 → 한국어 텍스트 + 이모지 매핑 테이블
 * Open-Meteo API가 반환하는 weathercode 기준
 */
const WMO_MAP = {
  0: { text: '맑음', emoji: '☀️' },
  1: { text: '대체로 맑음', emoji: '🌤️' },
  2: { text: '구름 많음', emoji: '⛅' },
  3: { text: '흐림', emoji: '☁️' },
  45: { text: '안개', emoji: '🌫️' },
  48: { text: '안개', emoji: '🌫️' },
  51: { text: '이슬비', emoji: '🌦️' },
  53: { text: '이슬비', emoji: '🌦️' },
  55: { text: '이슬비', emoji: '🌦️' },
  61: { text: '비', emoji: '🌧️' },
  63: { text: '비', emoji: '🌧️' },
  65: { text: '강한 비', emoji: '🌧️' },
  71: { text: '눈', emoji: '❄️' },
  73: { text: '눈', emoji: '❄️' },
  75: { text: '강한 눈', emoji: '❄️' },
  80: { text: '소나기', emoji: '🌦️' },
  81: { text: '소나기', emoji: '🌦️' },
  82: { text: '강한 소나기', emoji: '🌦️' },
  95: { text: '천둥번개', emoji: '⛈️' },
  96: { text: '우박', emoji: '⛈️' },
  99: { text: '우박', emoji: '⛈️' },
};

function getWeatherInfo(code) {
  return WMO_MAP[code] ?? { text: '알 수 없음', emoji: '🌡️' };
}

/**
 * 현장 주소 기반 날씨 훅
 * 1단계: Nominatim(OpenStreetMap) geocoding → 위도/경도 취득
 * 2단계: Open-Meteo API → 날씨 정보 취득
 *
 * @param {string|null} address - 현장 주소 (없으면 날씨 미표시)
 * @returns {{ weather: { text, emoji, temp }|null, loading, error }}
 */
export function useWeather(address) {
  const [weather, setWeather] = useState(null);
  const [tomorrow, setTomorrow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 주소 없으면 날씨 표시 안 함
    if (!address || !address.trim()) {
      setWeather(null);
      setTomorrow(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchWeather = async () => {
      try {
        // ① Nominatim geocoding — 주소 → 위도/경도
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address.trim())}&format=json&limit=1`,
          { headers: { 'User-Agent': 'BPR-BuilderApp/1.0' } }
        );
        const geoData = await geoRes.json();

        if (!geoData.length) {
          throw new Error('주소를 찾을 수 없습니다.');
        }

        const { lat, lon } = geoData[0];

        // ② Open-Meteo 날씨 조회 — 현재 날씨 + 내일 일별 예보(최고/최저) + 강수확률
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current_weather=true` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
          `&timezone=Asia%2FSeoul&forecast_days=2`
        );
        if (!weatherRes.ok) throw new Error('날씨 API 오류');
        const weatherData = await weatherRes.json();

        const { weathercode, temperature } = weatherData.current_weather;
        const info = getWeatherInfo(weathercode);

        // 오늘(index 0) / 내일(index 1) 예보
        const daily = weatherData.daily;
        const todayRain = daily.precipitation_probability_max?.[0] ?? 0;
        const tomorrowInfo = getWeatherInfo(daily.weathercode[1]);
        const tempMax = daily.temperature_2m_max?.[1];
        const tempMin = daily.temperature_2m_min?.[1];

        // 내일 데이터가 없으면 null로 두어 UI에 NaN 표시 방지
        const tomorrowData = (tempMax != null && tempMin != null) ? {
          ...tomorrowInfo,
          tempMax: Math.round(tempMax),
          tempMin: Math.round(tempMin),
          rain: daily.precipitation_probability_max?.[1] ?? 0,
        } : null;

        if (!cancelled) {
          // rain: 오늘 강수확률(%)
          setWeather({ ...info, temp: Math.round(temperature), rain: todayRain });
          setTomorrow(tomorrowData);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message ?? '날씨를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchWeather();
    return () => { cancelled = true; };
  }, [address]); // 주소가 바뀌면(현장 전환 시) 다시 조회

  return { weather, tomorrow, loading, error };
}
