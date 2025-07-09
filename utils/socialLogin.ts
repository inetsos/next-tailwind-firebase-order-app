import { GoogleAuthProvider, signInWithPopup, linkWithCredential } from 'firebase/auth';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';

export async function signInWithGoogle() {
  // const provider = new GoogleAuthProvider();
  // //signInWithRedirect(auth, provider);
  // if (auth.currentUser) {
  //   linkWithRedirect(auth.currentUser, provider); // 🔗 현재 로그인된 사용자에 구글 계정 연결
  // } else {
  //   alert('로그인된 사용자 정보가 없습니다. 전화번호 인증 후 시도하세요.');
  //   console.warn('❌ auth.currentUser가 null입니다. 연결 불가.');
  // }

  // if (!auth.currentUser) {
  //   alert('먼저 전화번호 로그인 후 시도하세요');
  //   return;
  // }

  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) throw new Error('자격 증명을 가져올 수 없습니다.');

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('현재 로그인된 사용자가 없습니다.');
    }

    await linkWithCredential(currentUser, credential);

    // 연동된 구글 UID 추가 저장
    const googleUid = result.user.uid;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      uids: arrayUnion(`google:${googleUid}`),
    });

    console.log('✅ 구글 계정 연동 완료');
  } catch (error) {
    console.error('❌ 연동 실패:', error);
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
