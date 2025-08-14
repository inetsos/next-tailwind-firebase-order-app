'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { UserData } from '@/types/UserData';
import { useUserStore } from '@/stores/userStore';

interface EmailAuthProps {
  onLoginSuccess: () => void;
}

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!;
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!;

export default function EmailAuth({ onLoginSuccess }: EmailAuthProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [kakaoAuthUrl, setKakaoAuthUrl] = useState('');
  const [naverAuthUrl, setNaverAuthUrl] = useState('');

  // 소셜 로그인 URL 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost';

      const kakaoRedirectUri = isLocal
        ? 'http://localhost:3000/kakao-callback'
        : 'https://www.sijilife.kr/kakao-callback';
      setKakaoAuthUrl(
        `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
          kakaoRedirectUri
        )}`
      );

      const naverRedirectUri = isLocal
        ? 'http://localhost:3000/naver-callback'
        : 'https://www.sijilife.kr/naver-callback';
      const NAVER_STATE = Math.random().toString(36).substring(2);
      setNaverAuthUrl(
        `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(
          naverRedirectUri
        )}&state=${NAVER_STATE}`
      );
    }
  }, []);

  // 로그인/회원가입 처리
  const handleAuth = async () => {
    if (!email || !password) {
      alert('이메일과 비밀번호를 입력하세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const userData: UserData = {
          userId: user.uid,
          email: user.email || '',
          phoneNumber: '',
          createdAt: serverTimestamp(),
          displayName: '',
          role: 'customer',
          uids: [user.uid],
        };
        await setDoc(userRef, userData);
        console.log('신규 사용자 등록');
        router.replace('/mypage/profile');
      } else {
        console.log('기존 사용자 로그인');
        router.replace('/');
      }

      useUserStore.getState().setFirebaseUser(user);
      useUserStore.getState().setUserData(
        docSnap.exists()
          ? (docSnap.data() as UserData)
          : {
              userId: user.uid,
              email: user.email || '',
              phoneNumber: '',
              createdAt: serverTimestamp(),
              displayName: '',
              role: 'customer',
              uids: [user.uid],
            }
      );

      onLoginSuccess();
    } catch (error: any) {
      console.error(error);
      alert(`처리 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="email"
        className={"w-full border border-gray-300 mt-2 px-3 py-2 rounded "+
                  "bg-white text-black dark:bg-gray-800 dark:text-white"}
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full border border-gray-300 px-3 py-2 rounded bg-white text-black dark:bg-gray-800 dark:text-white"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* 이메일 로그인 / 회원가입 버튼 */}
      <button
        className={`w-full py-2 rounded transition-colors ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white' // 파란색으로 변경
        }`}
        onClick={handleAuth}
        disabled={isLoading}
      >
        {isLoading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
      </button>

      <p
        className="text-xs text-center text-gray-800 cursor-pointer hover:underline"
        onClick={() => setIsSignUp(!isSignUp)}
      >
        {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
      </p>

      <hr className="border-t border-gray-300 my-6 dark:border-gray-600" />

      {/* 카카오 로그인 */}
      <button
        className="w-full bg-[#FEE500] text-black py-2 px-4 rounded flex items-center justify-center gap-2 hover:brightness-95 transition"
        onClick={() => {
          window.location.href = kakaoAuthUrl;
        }}
      >
        <img src="/icons/kakao-logo.png" alt="카카오 아이콘" className="w-5 h-5" />
        <span className="text-sm font-medium">카카오로 로그인</span>
      </button>

      {/* 네이버 로그인 */}
      <button
        className="w-full bg-[#03C75A] text-white py-2 px-4 rounded flex items-center justify-center gap-2 hover:brightness-110 transition"
        onClick={() => {
          window.location.href = naverAuthUrl;
        }}
      >
        <img src="/icons/naver-logo.png" alt="네이버 아이콘" className="w-6 h-6" />
        <span className="text-sm font-medium">네이버로 로그인</span>
      </button>
    </div>
  );
}
