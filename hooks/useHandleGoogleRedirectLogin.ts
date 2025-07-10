import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/firebase/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useUserStore } from '@/stores/userStore';
import type { UserData } from '@/types/UserData';

export async function handleRedirectResultAfterLinking() {
  try {
    const result = await getRedirectResult(auth);

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
