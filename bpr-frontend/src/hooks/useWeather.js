import { useState, useEffect } from 'react';
import useLangStore from '../store/langStore';

/**
 * WMO 날씨 코드 → 텍스트 + 이모지 매핑 테이블
 * Open-Meteo API가 반환하는 weathercode 기준
 * lang: 'ko' | 'ja'
 */
const WMO_MAP = {
  0:  { ko: '맑음',       ja: '晴れ',         emoji: '☀️' },
  1:  { ko: '대체로 맑음', ja: 'おおむね晴れ',  emoji: '🌤️' },
  2:  { ko: '구름 많음',   ja: '曇りがち',     emoji: '⛅' },
  3:  { ko: '흐림',       ja: '曇り',         emoji: '☁️' },
  45: { ko: '안개',       ja: '霧',           emoji: '🌫️' },
  48: { ko: '안개',       ja: '霧',           emoji: '🌫️' },
  51: { ko: '이슬비',     ja: '霧雨',         emoji: '🌦️' },
  53: { ko: '이슬비',     ja: '霧雨',         emoji: '🌦️' },
  55: { ko: '이슬비',     ja: '霧雨',         emoji: '🌦️' },
  61: { ko: '비',         ja: '雨',           emoji: '🌧️' },
  63: { ko: '비',         ja: '雨',           emoji: '🌧️' },
  65: { ko: '강한 비',    ja: '強い雨',       emoji: '🌧️' },
  71: { ko: '눈',         ja: '雪',           emoji: '❄️' },
  73: { ko: '눈',         ja: '雪',           emoji: '❄️' },
  75: { ko: '강한 눈',    ja: '大雪',         emoji: '❄️' },
  80: { ko: '소나기',     ja: 'にわか雨',     emoji: '🌦️' },
  81: { ko: '소나기',     ja: 'にわか雨',     emoji: '🌦️' },
  82: { ko: '강한 소나기', ja: '強いにわか雨', emoji: '🌦️' },
  95: { ko: '천둥번개',   ja: '雷雨',         emoji: '⛈️' },
  96: { ko: '우박',       ja: '雹',           emoji: '⛈️' },
  99: { ko: '우박',       ja: '雹',           emoji: '⛈️' },
};

function getWeatherInfo(code, lang = 'ko') {
  const entry = WMO_MAP[code];
  if (!entry) return { text: lang === 'ja' ? '不明' : '알 수 없음', emoji: '🌡️' };
  return { text: entry[lang] ?? entry.ko, emoji: entry.emoji };
}

/**
 * 현장 주소 기반 날씨 훅
 * 1단계: Nominatim(OpenStreetMap) geocoding → 위도/경도 취득
 * 2단계: Open-Meteo API → 날씨 정보 취득
 *
 * @param {string|null} address - 현장 주소 (없으면 날씨 미표시)
 * @returns {{ weather: { text, emoji, temp }|null, tomorrow, loading, error }}
 */
export function useWeather(address) {
  /* 전역 언어 상태 구독 — 훅 파라미터로 받지 않아도 자동 반응 */
  const lang = useLangStore((s) => s.lang);

  const [weather, setWeather] = useState(null);
  const [tomorrow, setTomorrow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
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
          throw new Error(lang === 'ja' ? '住所が見つかりません。' : '주소를 찾을 수 없습니다.');
        }

        const { lat, lon } = geoData[0];

        // ② Open-Meteo 날씨 조회 — 현재 날씨 + 내일 일별 예보(최고/최저) + 강수확률
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current_weather=true` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
          `&timezone=Asia%2FSeoul&forecast_days=2`
        );
        if (!weatherRes.ok) throw new Error(lang === 'ja' ? '天気APIエラー' : '날씨 API 오류');
        const weatherData = await weatherRes.json();

        const { weathercode, temperature } = weatherData.current_weather;
        const info = getWeatherInfo(weathercode, lang);

        const daily = weatherData.daily;
        const todayRain = daily.precipitation_probability_max?.[0] ?? 0;
        const tomorrowInfo = getWeatherInfo(daily.weathercode[1], lang);
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
      } catch (e) {
        if (!cancelled) {
          setError(e.message ?? (lang === 'ja' ? '天気を取得できません。' : '날씨를 불러오지 못했습니다.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWeather();
    return () => { cancelled = true; };
  }, [address, lang]); /* lang 변경 시 재조회하여 텍스트 즉시 반영 */

  return { weather, tomorrow, loading, error };
}
