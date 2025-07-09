'use client'

import { useState, useEffect, useRef } from 'react'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithCustomToken,
  PhoneAuthProvider,
  linkWithCredential,
  User,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/firebase/firebaseConfig'
import { getFunctions, httpsCallable } from 'firebase/functions'

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier
    Kakao: any
  }
}

export default function AuthPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [verificationId, setVerificationId] = useState<string | null>(null)

  const [user, setUser] = useState<User | null>(null)
  const [needsPhoneLink, setNeedsPhoneLink] = useState(false)
  const recaptchaInitialized = useRef(false)
  const kakaoInitialized = useRef(false)

  // ✅ 1. recaptcha 및 Kakao SDK 로드 + 로그인 상태 구독
  useEffect(() => {
    if (!recaptchaInitialized.current && typeof window !== 'undefined') {
      console.log('🛠️ Recaptcha initializing...')
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('reCAPTCHA solved'),
      })

      window.recaptchaVerifier.render().then((widgetId: number) => {
        console.log('✅ reCAPTCHA rendered with widgetId:', widgetId)
      })

      recaptchaInitialized.current = true
      window.recaptchaVerifier.render()
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setNeedsPhoneLink(firebaseUser?.phoneNumber ? false : true)
    })

    return () => unsubscribe()
  }, [])

  // ✅ 전화번호 인증번호 전송
  const sendCode = async () => {
    if (!phone) return alert('전화번호를 입력하세요')

    try {
      //console.log(window.recaptchaVerifier);
       // 🔒 reCAPTCHA 수동 실행
      await window.recaptchaVerifier.verify()

      const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)
      setVerificationId(confirmationResult.verificationId)
      alert('인증번호가 전송되었습니다')
    } catch (error: any) {
      alert('전송 실패: ' + error.message)
    }
  }

  // ✅ 인증번호 확인 및 로그인 or 계정 연결
  const verifyCode = async () => {
    if (!code || !verificationId) return alert('인증번호를 입력하세요')

    try {
      const phoneCredential = PhoneAuthProvider.credential(verificationId, code)

      if (user) {
        await linkWithCredential(user, phoneCredential)
        alert('전화번호가 계정에 연결되었습니다')
        setNeedsPhoneLink(false)
      } else {
        console.log("wwww")
        const result = await signInWithCredential(auth, phoneCredential)
        setUser(result.user)
        alert('전화번호로 로그인 성공')
      }
    } catch (error: any) {
      alert('인증 실패: ' + error.message)
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setNeedsPhoneLink(false)
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-xl font-bold text-center">Firebase 통합 인증</h2>

      {user ? (
        <div className="flex flex-col items-center gap-4">
          <img src={user.photoURL || ''} className="w-20 h-20 rounded-full" />
          <div className="text-lg font-semibold">
            {user.displayName || user.email || user.phoneNumber}
          </div>
          <button onClick={logout} className="bg-gray-700 text-white px-4 py-2 rounded">
            로그아웃
          </button>

          {needsPhoneLink && (
            <>
              <hr className="w-full my-4" />
              <div className="text-sm text-gray-600">전화번호 인증이 필요합니다</div>
              <input
                className="w-full border px-3 py-2 rounded"
                placeholder="+821012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button onClick={sendCode} className="bg-blue-600 text-white w-full py-2 rounded">
                인증번호 전송
              </button>
              <input
                className="w-full border px-3 py-2 rounded"
                placeholder="인증번호"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button onClick={verifyCode} className="bg-green-600 text-white w-full py-2 rounded">
                인증번호 확인
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <input
            className="w-full border px-3 py-2 rounded mt-4"
            placeholder="+821012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={sendCode} className="bg-blue-600 text-white w-full py-2 rounded">
            인증번호 전송
          </button>
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="인증번호"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={verifyCode} className="bg-green-600 text-white w-full py-2 rounded">
            인증번호 확인
          </button>
        </>
      )}

      <div id="recaptcha-container"></div>
    </div>
  )
}
