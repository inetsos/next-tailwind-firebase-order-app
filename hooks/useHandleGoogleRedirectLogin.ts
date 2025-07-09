import { useEffect } from 'react';
import {
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, db } from '@/firebase/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';

export function useHandleGoogleRedirectLogin() {
  useEffect(() => {
    const handleRedirectLogin = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (!result || !result.user) return;

        const { user } = result;
        console.log('로그인된 유저:', user);

        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName ?? '',
            email: user.email ?? '',
            phoneNumber: user.phoneNumber ?? '',
            role: 'customer',
            createdAt: serverTimestamp(),
            uids: [user.uid],
          });
        } else {
          await updateDoc(userRef, {
            uids: arrayUnion(user.uid),
          });
        }

        console.log('✅ 리디렉션 방식으로 로그인 완료:', user.uid);
      } catch (error) {
        console.error('❌ 로그인 처리 중 오류 발생:', error);
      }
    };

    handleRedirectLogin();
  }, []);
}