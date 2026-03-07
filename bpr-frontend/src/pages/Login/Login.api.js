import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../utils/firebaseConfig';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

/**
 * 아이디(이메일) 찾기 (Firestore 'users' 컬렉션 검색)
 * @param {string} name 
 * @returns {Promise<string>} 가려진 이메일 또는 에러 메시지
 */
export async function findEmailByName(name) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('name', '==', name));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('해당 이름으로 가입된 계정이 없습니다.');
  }

  // 여러 개가 나올 수 있지만 첫 번째 매칭된 이메일 반환 (실무에선 폰번 등 추가 식별 필요)
  const userDoc = querySnapshot.docs[0].data();
  const email = userDoc.email;

  // 이메일 일부 마스킹 (예: abcdef@gma... -> ab****@gma...)
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 2
    ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
    : localPart;

  return `${maskedLocal}@${domain}`;
}

/**
 * 비밀번호 재설정 (Firebase Auth 메일 발송)
 * @param {string} email 
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      throw new Error('등록되지 않은 아이디(이메일)입니다.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('유효하지 않은 이메일 형식입니다.');
    }
    throw new Error('비밀번호 재설정 메일 발송에 실패했습니다.');
  }
}

