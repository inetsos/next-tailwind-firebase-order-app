'use client';

import { useAuth } from '@/hooks/useAuth';
import { signInWithGoogle, signInWithKakao, signInWithNaver } from '@/utils/socialLogin';
import { useUserStore } from '@/stores/userStore';

export default function MyPageContent() {

  const { user: firebaseUser } = useAuth();
  const { userData } = useUserStore(); // 전역 사용자 정보 사용

  if (!firebaseUser || !userData)
    return <div className="text-center p-4 text-gray-500">로그인이 필요합니다.</div>;

  // 현재 연동 여부 확인
  const isLinked = (provider: 'google' | 'kakao' | 'naver') => {
    return userData.uids?.some((uid: string) => uid.startsWith(provider + ':'));
  };

  // SNS 로그인 버튼 핸들러
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      alert('구글 로그인 실패');
      console.error(error);
    }
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

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-xl shadow bg-white space-y-6">
      <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>

      <div className="space-y-2.5 text-sm text-gray-800">
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600">UID</span>
          <span>{userData.userId}</span>
        </div>
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600">전화번호</span>
          <span>{userData.phoneNumber}</span>
        </div>
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600">이름</span>
          <span>{userData.displayName || '-'}</span>
        </div>
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600">역할</span>
          <span>{userData.role || '-'}</span>
        </div>
        <div className="flex">
          <span className="w-24 font-semibold text-gray-600">가입일</span>
          <span>{userData.createdAt?.toDate?.().toLocaleString() ?? '-'}</span>
        </div>
      </div>

      <hr className="border-t border-gray-300 my-6" />

      {/* SNS 로그인 연동 버튼 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleKakaoLogin}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black py-1 px-3 rounded transition"
          >
            카카오 로그인 연동
          </button>
          <span className="text-xs">
            {isLinked('kakao') ? '✅ 연동됨' : '❌ 미연동'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleNaverLogin}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded transition"
          >
            네이버 로그인 연동
          </button>
          <span className="text-xs">
            {isLinked('naver') ? '✅ 연동됨' : '❌ 미연동'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleGoogleLogin}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded transition"
          >
            구글 로그인 연동
          </button>
          <span className="text-xs">
            {isLinked('google') ? '✅ 연동됨' : '❌ 미연동'}
          </span>
        </div>
      </div>
    </div>
  );
}
