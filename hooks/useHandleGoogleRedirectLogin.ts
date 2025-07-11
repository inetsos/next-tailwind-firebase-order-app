import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { app, auth, db } from '@/firebase/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useUserStore } from '@/stores/userStore';
import type { UserData } from '@/types/UserData';

// 구글 연동 로그인은 일단 보류
// 리디렉션 후에 로그인 정보를 받지 못함. 원인 모름
export async function handleRedirectResultAfterLinking() {
  try {

    console.log('🟡 Firebase 인증 객체:', auth)
    console.log('🟢 Firebase 앱 객체:', app)

    const result = await getRedirectResult(auth);
    // 로그가 undefined로 찍힘
    console.log(result?.user.uid);
    
    if (result && result.user) {
      const currentUser = auth.currentUser;
      const googleUid = result.user.uid;

      if (!currentUser) return;

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

        useUserStore.getState().setUserData(updatedUserData);
      }

      console.log('✅ 구글 리디렉션 연동 완료');
    }
  } catch (error) {
    console.error('❌ 리디렉션 결과 처리 실패:', error);
  }
}
