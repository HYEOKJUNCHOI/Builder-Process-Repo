import api from '../../utils/axiosConfig';

/** 체크리스트 전체 조회 */
export async function fetchChecklist(projectId) {
  const { data } = await api.get(`/projects/${projectId}/checklist`);
  return data;
}

/** 소공정 상태 순환 (WAITING → IN_PROGRESS → TOUCH_UP → DONE → WAITING) */
export async function cycleStatus(minorId) {
  const { data } = await api.patch(`/minor-processes/${minorId}/status`);
  return data.status;
}

/** 오늘 할 일 토글 */
export async function toggleToday(minorId) {
  const { data } = await api.patch(`/minor-processes/${minorId}/today`);
  return data.isToday;
}

/** 소공정 메모 수정 */
export async function updateMinorMemo(minorId, memo) {
  await api.patch(`/minor-processes/${minorId}/memo`, { memo });
}

/** 대공정 추가 */
export async function addMajorProcess(projectId, name) {
  await api.post(`/projects/${projectId}/major-processes`, { name });
}

/** 소공정 추가 (메모 선택) — 공백이면 전송하지 않음 */
export async function addMinorProcess(majorId, name, memo) {
  const payload = { name };
  if (memo && memo.trim()) payload.memo = memo.trim();
  await api.post(`/major-processes/${majorId}/minor-processes`, payload);
}

/** 대공정 삭제 */
export async function deleteMajorProcess(majorId) {
  await api.delete(`/major-processes/${majorId}`);
}

/** 소공정 삭제 */
export async function deleteMinorProcess(minorId) {
  await api.delete(`/minor-processes/${minorId}`);
}

/** 현장 정보 수정 (이름/주소/착공일/준공예정일) */
export async function updateProject(projectId, payload) {
  const { data } = await api.patch(`/projects/${projectId}`, payload);
  return data;
}

/** 현장 삭제 (하위 대공정/소공정 포함) */
export async function deleteProject(projectId) {
  await api.delete(`/projects/${projectId}`);
}
