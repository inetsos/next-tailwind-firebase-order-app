import {
  GoogleAuthProvider,
  linkWithPopup,
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
  const currentUser = auth.currentUser
  if (!currentUser) {
    alert('전화번호로 로그인 후 시도해주세요.')
    return
  }

  const alreadyLinked = currentUser.providerData.some(
    (p) => p.providerId === GoogleAuthProvider.PROVIDER_ID
  )
  if (alreadyLinked) {
    alert('이미 구글 계정이 연동되어 있습니다.')
    return
  }

  const provider = new GoogleAuthProvider()
  try {
    const result = await linkWithPopup(currentUser, provider)
    const linkedUser = result.user

    const googleUid = result.user.uid;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      uids: arrayUnion(`google:${googleUid}`),
    });

    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const docData = userSnap.data();
      const updatedUserData: UserData = {
        userId: docData.userId,
        phoneNumber: docData.phoneNumber ?? '',
        displayName: docData.displayName,
        role: docData.role,
        createdAt: docData.createdAt,
        uids: docData.uids ?? [],
      };

      useUserStore.getState().setFirebaseUser(currentUser);
      useUserStore.getState().setUserData(updatedUserData);
    }

    alert('✅ Google 계정 연동 완료: ' + linkedUser.email)
    //console.log('🔗 연동된 사용자:', linkedUser)

  } catch (error) {
    console.error('❌ Google 연동 실패:', error)
    alert('Google 연동에 실패했습니다.')
  }
}

export async function signInWithKakao() {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!

  // 로컬 또는 배포 상태에 따른 처리
  const isLocal = window.location.hostname === 'localhost';
  const kakaoRedirectUri = isLocal
    ? 'http://localhost:3000/kakao-callback'
    : 'https://www.sijilife.kr/kakao-callback';

  const redirectUri = encodeURIComponent(kakaoRedirectUri)
  const state = Math.random().toString(36).substring(2)

  // 로그인 인가 코드 요청
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`
  window.location.href = kakaoAuthUrl
}

export async function signInWithNaver() {

  const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!;

  const isLocal = window.location.hostname === 'localhost';
  const naverRedirectUri = isLocal
    ? 'http://localhost:3000/naver-callback'
    : 'https://www.sijilife.kr/naver-callback';
  const redirectUri = encodeURIComponent(naverRedirectUri);

  const state = Math.random().toString(36).substring(2); // CSRF 방지를 위한 임의 문자열
  // 로그인 인가 코드 요청
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  window.location.href = naverAuthUrl;
}


