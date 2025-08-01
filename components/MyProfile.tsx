'use client';

import { useAuth } from '@/hooks/useAuth';
import { signInWithGoogle, signInWithKakao, signInWithNaver } from '@/utils/socialLogin';
import { useUserStore } from '@/stores/userStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export default function MyPageContent() {
  const { user: firebaseUser } = useAuth();
  const { userData } = useUserStore();
 
  if (!firebaseUser || !userData)
    return <div className="text-center p-4 text-gray-500 dark:text-gray-400">로그인이 필요합니다.</div>;

  const isLinked = (provider: 'google' | 'kakao' | 'naver') => {
    return userData.uids?.some((uid: string) => uid.startsWith(provider + ':'));
  };

  const handleKakaoLogin = async () => {
    try {
      await signInWithKakao();
    } catch (error) {
      alert('카카오 로그인 실패');
      console.error(error);
    }
  };

  const handleNaverLogin = async () => {
    try {
      await signInWithNaver();
    } catch (error) {
      alert('네이버 로그인 실패');
      console.error(error);
    }
  };

  const unlinkProvider = async (provider: 'kakao' | 'naver') => {

    const confirmed = confirm(`${provider.toUpperCase()} 연동을 해제하시겠습니까?`);
    if (!confirmed) return;

    try {
      // 기존 uids 배열에서 해당 provider UID 제거
      const newUids = userData.uids.filter(uid => !uid.startsWith(provider + ':'));
      // Firestore 업데이트
      const userRef = doc(db, 'users', userData.userId);
      await updateDoc(userRef, { uids: newUids });
      // zustand 전역 상태도 동기화
      useUserStore.getState().setUserData({
        ...userData,
        uids: newUids,
      });
      alert(`${provider.toUpperCase()} 연동이 해제되었습니다.`);
    } catch (err) {
      console.error(err);
      alert('연동 해제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 p-4 rounded-xl shadow bg-white dark:bg-gray-800 space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">내프로필</h1>

      <div className="space-y-2.5 text-sm text-gray-800 dark:text-gray-200">
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600 dark:text-gray-400">UID</span>
          <span>{userData.userId}</span>
        </div>
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600 dark:text-gray-400">전화번호</span>
          <span>{userData.phoneNumber}</span>
        </div>
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600 dark:text-gray-400">이름</span>
          <span>{userData.displayName || '-'}</span>
        </div>
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600 dark:text-gray-400">역할</span>
          <span>{userData.role || '-'}</span>
        </div>
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600 dark:text-gray-400">가입일</span>
          <span>{userData.createdAt?.toDate?.().toLocaleString() ?? '-'}</span>
        </div>
      </div>

      <hr className="border-t border-gray-300 dark:border-gray-600 my-6" />

      <div className="space-y-3">
        <div className="w-full">
          <button
            className="w-full bg-[#FEE500] text-black py-2 px-4 rounded flex items-center justify-center gap-2 hover:brightness-95"
            onClick={handleKakaoLogin}
          >
            <img src="/icons/kakao-logo.png" alt="카카오 아이콘" className="w-5 h-5" />
            <span className="text-sm font-medium">카카오 로그인 연동</span>
          </button>

          <div className="flex justify-end items-center mt-1 mr-2 gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {isLinked('kakao') ? '✅ 연동됨' : '❌ 미연동'}
            </span>
            {isLinked('kakao') && (
              <button
                onClick={() => unlinkProvider('kakao')}
                className="text-xs text-gray-500 underline hover:text-gray-600"
              >
                연동 해제
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col w-full gap-1">
          <button
            className="w-full bg-[#03C75A] text-white py-2 px-4 rounded flex items-center justify-center gap-2 hover:brightness-110"
            onClick={handleNaverLogin}
          >
            <img src="/icons/naver-logo.png" alt="네이버 아이콘" className="w-6 h-6" />
            <span className="text-sm font-medium">네이버 로그인 연동</span>
          </button>

          <div className="flex justify-end items-center mt-1 mr-2 gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {isLinked('naver') ? '✅ 연동됨' : '❌ 미연동'}
            </span>
            {isLinked('naver') && (
              <button
                onClick={() => unlinkProvider('naver')}
                className="text-xs text-gray-500 underline hover:text-gray-600"
              >
                연동 해제
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
