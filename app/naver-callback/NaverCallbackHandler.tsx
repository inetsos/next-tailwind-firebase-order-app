// app/naver-callback/NaverCallbackHandler.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getFunctions, httpsCallable } from 'firebase/functions'
import {
  signInWithCustomToken,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'
import { auth, db } from '@/firebase/firebaseConfig'
import { useUserStore } from '@/stores/userStore'
import type { UserData } from '@/types/UserData'

export default function NaverCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const hasRun = useRef(false)
  const hasRedirected = useRef(false)

  const [loading, setLoading] = useState(true)

  // 🔹 prevPath 가져오기
  const { prevPath, setPrevPath, setFirebaseUser, setUserData } = useUserStore()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state || hasRun.current) return

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (hasRun.current) return
      hasRun.current = true

      try {
        const functions = getFunctions(undefined, 'asia-northeast3')
        const naverLogin = httpsCallable(functions, 'naverLogin')

        const isLocal = window.location.hostname === 'localhost'
        const naverRedirectUri = isLocal
          ? 'http://localhost:3000/naver-callback'
          : 'https://www.sijilife.kr/naver-callback'

        const result: any = await naverLogin({ code, state, naverRedirectUri })
        const { firebaseToken, naverUid, nickname } = result.data
        let currentUser: User

        if (!user) {
          // 신규 로그인
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
            alert('✅ 네이버 계정이 연결되어 있지 않습니다.\n회원가입 후 로그인 계정 연동해야 합니다.')
            await signOut(auth)
            hasRedirected.current = true
            router.replace('/?login=true')
            return
          }

          const userData = useUserStore.getState().userData
          if (
            userData?.userId &&
            (!userData.displayName || userData.displayName.trim() === '')
          ) {
            const userRef = doc(db, 'users', userData.userId)
            await updateDoc(userRef, { displayName: nickname })
          }

          console.log('네이버 계정으로 신규 로그인 완료:', currentUser.uid)

          if (!hasRedirected.current) {
            console.log('Naver: ', prevPath)
            router.replace(prevPath || '/') // 🔹 저장된 경로로 이동
            setPrevPath(null) // 사용 후 초기화
          }
        } else {
          // 계정 연동
          const userStore = useUserStore.getState()
          const isLinked = userStore.userData?.uids?.includes(naverUid)
          if (isLinked) {
            alert('✅ 이미 연동되어 있습니다.')
          } else {
            currentUser = user
            const userRef = doc(db, 'users', currentUser.uid)
            await updateDoc(userRef, {
              displayName: nickname,
              uids: arrayUnion(naverUid),
            })

            const snap = await getDoc(userRef)
            if (snap.exists()) {
              const data = snap.data()
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
              alert('✅ 네이버 계정으로 연동 완료')
            }
          }

          if (!hasRedirected.current) {
            router.replace(prevPath || '/mypage/profile')
            setPrevPath(null)
          }
        }
      } catch (error: any) {
        console.error('❌ 네이버 로그인 실패:', error)
        alert('네이버 로그인 오류: ' + error.message)
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
          <h2>네이버 로그인 처리 중...</h2>
          <p>잠시만 기다려주세요 🔄</p>
        </>
      ) : (
        <h2>로그인 완료!</h2>
      )}
    </div>
  )
}
