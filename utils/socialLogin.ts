import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
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
