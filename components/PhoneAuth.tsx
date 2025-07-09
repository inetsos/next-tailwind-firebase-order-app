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

  // 인증 코드 전송
  const sendCode = async () => {
    if (!phoneNumber.startsWith('+')) {
      alert('국가코드를 포함한 전화번호를 입력하세요. 예: +821012345678');
      return;
    }

    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
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

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          createdAt: serverTimestamp(),
          displayName: '',
          role: 'customer',
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
        인증번호 전송
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

      {/* invisible reCAPTCHA 위치 */}
      <div ref={recaptchaRef}></div>
    </div>
  );
}
