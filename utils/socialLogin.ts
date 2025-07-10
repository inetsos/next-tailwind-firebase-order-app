import {
  GoogleAuthProvider,
  linkWithRedirect,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { useUserStore } from '@/stores/userStore';
import type { UserData } from '@/types/UserData';

export async function signInWithGoogle() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert('전화번호로 로그인 후 시도해주세요.');
    return;
  }

  const alreadyLinked = currentUser.providerData.some(
    (p) => p.providerId === GoogleAuthProvider.PROVIDER_ID
  );
  if (alreadyLinked) {
    alert('이미 구글 계정이 연동되어 있습니다.');
    return;
  }

  const provider = new GoogleAuthProvider();
  try {
    await linkWithRedirect(currentUser, provider); // ✅ 페이지 리디렉션
  } catch (error) {
    console.error('❌ 구글 리디렉션 연동 실패:', error);
  }
}

export async function signInWithKakao() {
  throw new Error('카카오 로그인 구현 필요');
}

export async function signInWithNaver() {
  throw new Error('네이버 로그인 구현 필요');
}
