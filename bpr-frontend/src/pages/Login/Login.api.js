import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../utils/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * 로그인 API (Firebase Auth)
 * @param {string} loginId (email)
 * @param {string} password
 * @returns {{ accessToken, userId, name }}
 */
export async function login(loginId, password) {
  const userCredential = await signInWithEmailAndPassword(auth, loginId, password);
  const user = userCredential.user;

  // 파이어스토어에서 사용자 이름 정보 가져오기 (선택적)
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const name = userDoc.exists() ? userDoc.data().name : user.displayName || '이름없음';

  return {
    accessToken: await user.getIdToken(),
    userId: user.uid,
    name: name,
  };
}

/**
 * 회원가입 API (Firebase Auth)
 * @param {string} loginId (email)
 * @param {string} password
 * @param {string} name
 * @returns {{ accessToken, userId, name }}
 */
export async function register(loginId, password, name) {
  const userCredential = await createUserWithEmailAndPassword(auth, loginId, password);
  const user = userCredential.user;

  // Firebase Auth 프로필 업데이트
  await updateProfile(user, { displayName: name });

  // DB에 user Meta 정보 추가 생성
  await setDoc(doc(db, 'users', user.uid), {
    email: loginId,
    name: name,
    createdAt: new Date().toISOString()
  });

  return {
    accessToken: await user.getIdToken(),
    userId: user.uid,
    name: name,
  };
}
