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

export function useHandleGoogleRedirectLogin(existingUid: string) {
  
  useEffect(() => {
    if (!existingUid) return; // 🔒 UID 없으면 실행하지 않음
    const handleRedirectLogin = async () => {
      try {
        const result = await getRedirectResult(auth);
        console.log(result?.user)
        if (!result || !result.user) return;

        const { user } = result;
        console.log('로그인된 유저:', user);

        const newUid = user.uid;

        // 새로운 로그인 사용자의 문서 생성 또는 업데이트
        const newUserRef = doc(db, 'users', newUid);
        const newUserSnap = await getDoc(newUserRef);

        if (!newUserSnap.exists()) {
          await setDoc(newUserRef, {
            uid: newUid,
            displayName: user.displayName ?? '',
            email: user.email ?? '',
            phoneNumber: user.phoneNumber ?? '',
            role: 'customer',
            createdAt: serverTimestamp(),
            uids: [newUid],
          });
        }

        // 기존 사용자 문서에 새 UID 추가
        if (existingUid) {
          const existingUserRef = doc(db, 'users', existingUid);
          await updateDoc(existingUserRef, {
            uids: arrayUnion(newUid),
          });
          console.log(`🔗 기존 사용자(${existingUid}) 문서에 ${newUid} 추가 완료`);
        }

        console.log('✅ 리디렉션 방식으로 로그인 완료:', newUid);
      } catch (error) {
        console.error('❌ 로그인 처리 중 오류 발생:', error);
      }
    };

    handleRedirectLogin();
  }, [existingUid]);
}