import api from '../../utils/axiosConfig';

/**
 * 로그인 API
 * @param {string} loginId
 * @param {string} password
 * @returns {{ accessToken, userId, name }}
 */
export async function login(loginId, password) {
  const { data } = await api.post('/auth/login', { loginId, password });
  return data;
}

/**
 * 회원가입 API
 * @param {string} loginId
 * @param {string} password
 * @param {string} name
 * @returns {{ accessToken, userId, name }}
 */
export async function register(loginId, password, name) {
  const { data } = await api.post('/auth/register', { loginId, password, name });
  return data;
}
