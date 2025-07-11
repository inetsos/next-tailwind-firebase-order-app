// components/PhoneAuth.tsx
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

const KAKAO_CLIENT_ID = '5f9989664ef55417d17008aadd415c6d';
const REDIRECT_URI = 'http://localhost:3000/kakao-callback';
const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!;
const NAVER_REDIRECT_URI = encodeURIComponent(process.env.NEXT_PUBLIC_NAVER_CALLBACK_URL!);
const NAVER_STATE = Math.random().toString(36).substring(2);
const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${NAVER_REDIRECT_URI}&state=${NAVER_STATE}`;

export default function PhoneAuth({ onLoginSuccess }: PhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // reCAPTCHA 설정
  useEffect(() => {
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
    // 예: +821012345678 → 010-1234-5678
    if (!e164.startsWith('+82')) return e164; // 한국 번호가 아니면 그대로 반환

    const local = '0' + e164.slice(3); // +82 제거 후 맨 앞에 0 추가
    if (local.length === 11) {
      return `${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
    if (local.length === 10) {
      return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
    }

    return local; // fallback
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
          phoneNumber,  //: user.phoneNumber,
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
        className="w-full border border-gray-300 px-3 py-2 rounded"
        placeholder="+821012345678"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <button
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        onClick={sendCode}
      >
        인증번호 요청
      </button>

      <input
        type="text"
        className="w-full border border-gray-300 px-3 py-2 rounded"
        placeholder="인증번호 입력"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
      />
      <button
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        onClick={verifyCode}
      >
        인증하기
      </button>

      <hr className="border-t border-gray-300 my-6" />

      <button
        className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300"
        onClick={() => {
          window.location.href = kakaoAuthUrl;
        }}
      >
        카카오 로그인
      </button>

      <button
        className="w-full bg-green-400 text-black py-2 rounded hover:bg-green-300"
        onClick={() => {
          window.location.href = naverAuthUrl;
        }}
      >
        네이버 로그인
      </button>

      {/* invisible reCAPTCHA 위치 */}
      <div ref={recaptchaRef}></div>
    </div>
  );
}
