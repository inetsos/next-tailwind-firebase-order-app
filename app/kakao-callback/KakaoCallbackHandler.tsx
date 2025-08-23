'use client'

import { useEffect, useState, useRef } from 'react'
import { auth, db } from '@/firebase/firebaseConfig'
import {
  signInWithCustomToken,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  query,
  collection,
  where
} from 'firebase/firestore'
import { useUserStore } from '@/stores/userStore'
import type { UserData } from '@/types/UserData'

export default function KakaoCallbackHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const hasRun = useRef(false)
  const hasRedirected = useRef(false)
  const [loading, setLoading] = useState(true)

  // 🔹 prevPath 가져오기
  const { userData, prevPath, setPrevPath, isLoginModalOpen, 
    setLoginModalOpen, setFirebaseUser, setUserData } = useUserStore();

  // useEffect(() => {
  //   if (!hasHydrated) return; // 아직 복원 안 됨
  // }, [hasHydrated, prevPath]);

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code || hasRun.current) return

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (hasRun.current) return
      hasRun.current = true

      try {
        const functions = getFunctions(undefined, 'asia-northeast3')
        const kakaoLogin = httpsCallable(functions, 'kakaoLogin')

        const isLocal = window.location.hostname === 'localhost'
        const kakaoRedirectUri = isLocal
          ? 'http://localhost:3000/kakao-callback'
          : 'https://www.sijilife.kr/kakao-callback'

        const result: any = await kakaoLogin({ code, kakaoRedirectUri })
        const { firebaseToken, kakaoUid, nickname } = result.data

        let currentUser: User

        if (!user) {
          // 로그인되지 않았으면 Custom Token으로 로그인
          const signInResult = await signInWithCustomToken(auth, firebaseToken)
          currentUser = signInResult.user

          const q = query(
            collection(db, 'users'),
            where('uids', 'array-contains', currentUser.uid)
          )
          const snapshot = await getDocs(q)

          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0]
            const data = docSnap.data()

            const userData: UserData = {
              userId: data.userId,
              phoneNumber: data.phoneNumber ?? '',
              displayName: data.displayName,
              role: data.role,
              createdAt: data.createdAt,
              uids: data.uids ?? [],
              uniqueNumber: data.uniqueNumber

            }
            setFirebaseUser(currentUser)
            setUserData(userData)
          } else {
            alert('✅ 카카오 계정이 연결되어 있지 않습니다.\n회원가입 후 로그인 계정 연동해야 합니다.')
            await auth.signOut()
            hasRedirected.current = true
            router.replace('/?login=true')
            return
          }

          const userData = useUserStore.getState().userData
          const shouldUpdateName =
            !userData?.displayName || userData.displayName.trim() === ''
          if (userData?.userId && shouldUpdateName) {
            const userRef = doc(db, 'users', userData.userId)
            await updateDoc(userRef, {
              displayName: nickname,
            })
          }

          console.log('카카오 계정으로 신규 로그인 완료:', currentUser.uid)
          if (!hasRedirected.current) {
            setLoginModalOpen(false); // 🔹 로그인 완료 시 모달 닫기
            router.replace(prevPath || '/');
            setPrevPath(null);
          }

          // if (!hasRedirected.current) {
          //   router.replace(prevPath || '/') // 🔹 저장된 경로로 이동
          //   setPrevPath(null) // 사용 후 초기화
          // }
        } else {
          // 이미 로그인 → 연동
          const userStore = useUserStore.getState()
          const isLinked = userStore.userData?.uids?.includes(kakaoUid)

          if (isLinked) {
            alert('✅ 이미 연동되어 있습니다.')
          } else {
            currentUser = user
            const userRef = doc(db, 'users', currentUser.uid)
            await updateDoc(userRef, {
              displayName: nickname,
              uids: arrayUnion(kakaoUid),
            })

            const finalSnap = await getDoc(userRef)
            if (finalSnap.exists()) {
              const data = finalSnap.data()
              const userData: UserData = {
                userId: data.userId,
                phoneNumber: data.phoneNumber ?? '',
                displayName: nickname,
                role: data.role,
                createdAt: data.createdAt,
                uids: data.uids ?? [],
                uniqueNumber: data.uniqueNumber
              }
              setFirebaseUser(user)
              setUserData(userData)
              alert('✅ 카카오 계정으로 연동 완료')
            }
          }

          if (!hasRedirected.current) {
            router.replace(prevPath || '/mypage/profile')
            setPrevPath(null)
          }
        }
      } catch (error: any) {
        console.error('❌ 카카오 로그인 실패:', error)
        alert(`카카오 로그인 중 오류 발생: ${error.message}`)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [searchParams, router, prevPath, setPrevPath, setFirebaseUser, setUserData])

  return (
    <div className="p-6 text-center">
      {loading ? (
        <>
          <h2>카카오 로그인 처리 중...</h2>
          <p>잠시만 기다려주세요 🔄</p>
        </>
      ) : (
        <h2>로그인 완료!</h2>
      )}
    </div>
  )
}
