import api from '../../utils/axiosConfig';

/** 일지 목록 조회 (날짜 내림차순) */
export async function fetchReports(projectId) {
  const { data } = await api.get(`/projects/${projectId}/reports`);
  return data;
}

/** 일지 상세 조회 */
export async function fetchReport(reportId) {
  const { data } = await api.get(`/reports/${reportId}`);
  return data;
}

/**
 * 일지 저장
 * @param {number} projectId
 * @param {{ reportDate: string, weather: string, minorProcessIds: number[] }} payload
 */
export async function createReport(projectId, payload) {
  const { data } = await api.post(`/projects/${projectId}/reports`, payload);
  return data;
}

/**
 * 오늘 날짜 보고서 조회 — 없으면 null 반환
 */
export async function fetchTodayReport(projectId) {
  try {
    const { data } = await api.get(`/projects/${projectId}/reports/today`);
    return data ?? null;
  } catch (err) {
    if (err.response?.status === 204 || err.response?.status === 404) return null;
    throw err;
  }
}

/** 보고서 추가 메모 수정 */
export async function updateAdditionalMemo(reportId, memo) {
  await api.patch(`/reports/${reportId}/additional-memo`, { memo });
}

/** 보고서 항목 메모 수정 */
export async function updateReportItemMemo(itemId, memo) {
  await api.patch(`/report-items/${itemId}/memo`, { memo });
}
