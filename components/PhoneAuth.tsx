'use client';

import { useEffect, useRef, useState } from 'react';
import { auth, db, RecaptchaVerifier } from '@/firebase/firebaseConfig';
import { signInWithPhoneNumber } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

interface PhoneAuthProps {
  onLoginSuccess: () => void;
}

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!;
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!;

export default function PhoneAuth({ onLoginSuccess }: PhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const [kakaoAuthUrl, setKakaoAuthUrl] = useState('');
  const [naverAuthUrl, setNaverAuthUrl] = useState('');

  // reCAPTCHA 설정
  useEffect(() => {

    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost';
      const kakaoRedirectUri = isLocal
        ? 'http://localhost:3000/kakao-callback'
        : 'https://next-tailwind-firebase-order-app.vercel.app/kakao-callback';
      const kakaoRedirectUriEncoding = encodeURIComponent(kakaoRedirectUri);
      const kakaoUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${kakaoRedirectUriEncoding}`;
      setKakaoAuthUrl(kakaoUrl);

      const naverRedirectUri = isLocal
        ? 'http://localhost:3000/naver-callback'
        : 'https://next-tailwind-firebase-order-app.vercel.app/naver-callback';
      const naverRedirectUriEncoding = encodeURIComponent(naverRedirectUri);
      const NAVER_STATE = Math.random().toString(36).substring(2);
      const naverUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${naverRedirectUriEncoding}&state=${NAVER_STATE}`;
      setNaverAuthUrl(naverUrl);
    }

    if (!window.recaptchaVerifier && recaptchaRef.current) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
      });
      window.recaptchaVerifier.render();
    }
  }, []);

  // 일반전화번호 형식 -> 국제전화번호 형식
  const formatPhoneNumberToE164 = (phoneNumber: string): string =>
    phoneNumber.startsWith('0') ? '+82' + phoneNumber.slice(1) : phoneNumber;

  // 국제전화번호 형식 -> 일반전화번호 형식
  const formatE164ToKorean = (e164: string): string => {
    // 한국 번호가 아니면 그대로 반환
    if (!e164.startsWith('+82')) return e164;

    // +82 제거 후 맨 앞에 0 추가
    const local = '0' + e164.slice(3);
    if (local.length === 11) {
      return `${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
    if (local.length === 10) {
      return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
    }
    return local;
  };

  // 인증 코드 전송
  const sendCode = async () => {
    const phoneNumberE164 = formatPhoneNumberToE164(phoneNumber);

    try {
      const result = await signInWithPhoneNumber(auth, phoneNumberE164, window.recaptchaVerifier);
      setConfirmationResult(result);
      alert('인증번호가 전송되었습니다.');
    } catch (error: any) {
      console.error(error);
      alert(`전송 실패: ${error.message}`);
    }
  };

  // 인증번호 확인 및 Firestore 저장
  const verifyCode = async () => {
    if (!confirmationResult) {
      alert('인증번호를 먼저 요청하세요.');
      return;
    }

    try {
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;

      // Firestore에 사용자 정보 저장
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      // 국제번호 형식을 일반번호 형식으로
      const phoneNumber = formatE164ToKorean(user.phoneNumber);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          userId: user.uid,
          phoneNumber,
          createdAt: serverTimestamp(),
          displayName: '',
          role: 'customer',
          uids: [user.uid]
        });
        console.log('신규 사용자 등록');
      } else {
        console.log('기존 사용자 로그인');
      }

      // 로그인 성공 콜백 호출 → 모달 닫기 등
      onLoginSuccess();
    } catch (error: any) {
      console.error(error);
      alert(`인증 실패: ${error.message}`);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="tel"
        className="w-full border border-gray-300 px-3 py-2 rounded
          bg-white text-black placeholder-gray-400
          dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
        placeholder="01012345678"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <button
        className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 transition-colors"
        onClick={sendCode}
      >
        인증번호 요청
      </button>

      <p className="text-sm text-gray-500 text-center -mt-2 dark:text-gray-400">
        처음 오시는 분은 전화번호 인증하시면 회원가입과 로그인이 됩니다.
      </p>

      <input
        type="text"
        className="w-full border border-gray-300 px-3 py-2 rounded
          bg-white text-black placeholder-gray-400
          dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
        placeholder="인증번호 입력"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
      />
      <button
        className="w-full bg-emerald-500 text-white py-2 rounded hover:bg-emerald-600 transition-colors"
        onClick={verifyCode}
      >
        인증하기
      </button>
      <p className="text-sm text-gray-500 text-center -mt-2 dark:text-gray-400">
        인증번호는 해외에서 발송됩니다.
      </p>

      <hr className="border-t border-gray-300 my-6 dark:border-gray-600" />

      <button
        className="w-full bg-[#FEE500] text-black py-2 px-4 rounded flex items-center justify-center gap-2 hover:brightness-95 transition"
        onClick={() => {
          window.location.href = kakaoAuthUrl;
        }}
      >
        <img
          src="/icons/kakao-logo.png"
          alt="카카오 아이콘"
          className="w-5 h-5"
        />
        <span className="text-sm font-medium">카카오로 로그인</span>
      </button>

      <button
        className="w-full bg-[#03C75A] text-white py-2 px-4 rounded flex items-center justify-center gap-2 hover:brightness-110 transition"
        onClick={() => {
          window.location.href = naverAuthUrl;
        }}
      >
        <img
          src="/icons/naver-logo.png"
          alt="네이버 아이콘"
          className="w-6 h-6"
        />
        <span className="text-sm font-medium">네이버로 로그인</span>
      </button>

      {/* invisible reCAPTCHA 위치 */}
      <div ref={recaptchaRef}></div>
    </div>
  );
}
