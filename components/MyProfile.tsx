'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { signInWithKakao, signInWithNaver } from '@/utils/socialLogin';
import { useUserStore } from '@/stores/userStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export default function MyProfileContent() {
  const { user: firebaseUser } = useAuth();
  const { userData, setUserData } = useUserStore();

  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || '');
  
  // userData가 준비되면 state 업데이트
  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || '');
      setPhoneNumber(userData.phoneNumber || '');
    }
  }, [userData]);

  const [loadingField, setLoadingField] = useState<string | null>(null);

  if (!firebaseUser || !userData)
    return (
      <div className="text-center p-4 text-gray-500 dark:text-gray-400">
        로그인이 필요합니다.
      </div>
    );

  const isLinked = (provider: 'google' | 'kakao' | 'naver') =>
    userData.uids?.some((uid: string) => uid.startsWith(provider + ':'));

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
      const newUids = userData.uids.filter((uid) => !uid.startsWith(provider + ':'));
      const userRef = doc(db, 'users', userData.userId);
      await updateDoc(userRef, { uids: newUids });

      setUserData({
        ...userData,
        uids: newUids,
      });

      alert(`${provider.toUpperCase()} 연동이 해제되었습니다.`);
    } catch (err) {
      console.error(err);
      alert('연동 해제 중 오류가 발생했습니다.');
    }
  };

  // 개별 필드 저장
  const updateField = async (field: 'displayName' | 'phoneNumber') => {
    try {
      setLoadingField(field);
      const value = field === 'displayName' ? displayName : phoneNumber;
      const userRef = doc(db, 'users', userData.userId);
      await updateDoc(userRef, { [field]: value });

      setUserData({
        ...userData,
        [field]: value,
      });

      //alert('저장되었습니다.');
    } catch (error) {
      console.error(error);
      alert('저장 실패');
    } finally {
      setLoadingField(null);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 p-4 rounded-xl shadow bg-white dark:bg-gray-800 space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">내프로필</h1>

      <div className="space-y-2.5 text-sm text-gray-800 dark:text-gray-200">
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600 dark:text-gray-400">이메일</span>
          <span>{userData.email}</span>
        </div>

        {/* 전화번호 */}
        <div className="flex items-center gap-0">
          <span className="w-24 font-semibold text-gray-600 dark:text-gray-400">전화번호</span>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="flex-1 border rounded mr-2 px-2 py-1 text-gray-800 dark:text-gray-200 bg-transparent border-gray-300 dark:border-gray-600"
          />
          <button
            onClick={() => updateField('phoneNumber')}
            disabled={loadingField === 'phoneNumber'}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loadingField === 'phoneNumber' ? '저장중...' : '저장'}
          </button>
        </div>

        {/* 이름 */}
        <div className="flex items-center gap-0">
          <span className="w-24 font-semibold text-gray-600 dark:text-gray-400">이름(별명)</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-1 border rounded mr-2 px-2 py-1 text-gray-800 dark:text-gray-200 bg-transparent border-gray-300 dark:border-gray-600"
          />
          <button
            onClick={() => updateField('displayName')}
            disabled={loadingField === 'displayName'}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loadingField === 'displayName' ? '저장중...' : '저장'}
          </button>
        </div>

        {/* <div className="flex">
          <span className="w-24 font-semibold text-gray-600 dark:text-gray-400">역할</span>
          <span>{userData.role || '-'}</span>
        </div> */}
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
