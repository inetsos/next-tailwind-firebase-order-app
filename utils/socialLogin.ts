import { GoogleAuthProvider, linkWithRedirect } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  //signInWithRedirect(auth, provider);
  if (auth.currentUser) {
    linkWithRedirect(auth.currentUser, provider); // 🔗 현재 로그인된 사용자에 구글 계정 연결
  } else {
    alert('로그인된 사용자 정보가 없습니다. 전화번호 인증 후 시도하세요.');
    console.warn('❌ auth.currentUser가 null입니다. 연결 불가.');
  }
}

// 카카오, 네이버 로그인 구현은 각 OAuth SDK나 Firebase Custom Token 등 방식에 따라 다름
export async function signInWithKakao() {
  // TODO: 카카오 로그인 구현
  throw new Error('구현 필요');
}

export async function signInWithNaver() {
  // TODO: 네이버 로그인 구현
  throw new Error('구현 필요');
}
