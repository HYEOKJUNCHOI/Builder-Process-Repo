import api from '../../utils/axiosConfig';

/**
 * 내 현장 목록 조회
 * @returns {Array<{ id, name, address, startDate, endDate }>}
 */
export async function fetchMyProjects() {
  const { data } = await api.get('/projects/my');
  return data;
}

/**
 * 오늘 할 일 목록 조회
 * - is_today = true 인 소공정 반환
 * @param {number} projectId
 * @returns {{ projectName, todayTasks: Array<{ id, majorName, name, status, memo }> }}
 */
export async function fetchDashboard(projectId) {
  const { data } = await api.get(`/projects/${projectId}/dashboard`);
  return data;
}

/**
 * 현장 생성
 * @param {{ name, address, lat, lng, startDate, endDate, templateId? }} payload
 * @returns {{ id, name, ... }}
 */
export async function createProject(payload) {
  const { data } = await api.post('/projects', payload);
  return data;
}

/**
 * 템플릿 목록 조회 (현장 생성 시 선택용)
 * @returns {Array<{ id, name, isDefault }>}
 */
export async function fetchTemplates() {
  const { data } = await api.get('/templates');
  return data;
}
