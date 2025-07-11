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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state || hasRun.current) return

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      //onAuthStateChanged 상태 변화로 인한 중복 실행시 재실행 방지
      if (hasRun.current) return
      hasRun.current = true

      try {
        const functions = getFunctions(undefined, 'asia-northeast3')
        const naverLogin = httpsCallable(functions, 'naverLogin')
        
        // 로컬 또는 배포 상태에 따른 처리
        const isLocal = window.location.hostname === 'localhost';
        const naverRedirectUri = isLocal
          ? 'http://localhost:3000/naver-callback'
          : 'https://next-tailwind-firebase-order-app.vercel.app/naver-callback';

        const result: any = await naverLogin({ code, state, naverRedirectUri })
        const { firebaseToken, naverUid, displayName } = result.data

        let currentUser: User

        if (!user) {
          // 로그인 상태가 아니므로 로그인한다.
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
            }
            useUserStore.getState().setUserData(userData)
          } else {
            alert('✅ 네이버 계정이 연결되어 있지 않습니다.\n전화번호 인증 후 로그인 계정 연동해야 합니다.')
            await signOut(auth)
            hasRedirected.current = true
            router.replace('/?login=true')
            return
          }

          const userData = useUserStore.getState().userData
          if (userData?.userId && (!userData.displayName || userData.displayName.trim() === '')) {
            const userRef = doc(db, 'users', userData.userId)
            await updateDoc(userRef, { displayName })
          }

          console.log('네이버 계정으로 신규 로그인 완료:', currentUser.uid)

        } else {
          
          // 로그인 상태이다.
          // 이 경우 SNS 로그인 연동 요청이다.
          // 그렇다면 처음 연동인지, 이미 연동되어 있는지 확인이 필요하다.

          // naverUid가 uids 안에 있는지 확인한다.
          const userStore = useUserStore.getState()
          const isLinked = userStore.userData?.uids?.includes(naverUid)
          if (isLinked) {
              alert('✅ 이미 연동되어 있습니다.')
          } else {
            currentUser = user

            const userRef = doc(db, 'users', currentUser.uid)
            await updateDoc(userRef, {
              uids: arrayUnion(naverUid),
            })

            const snap = await getDoc(userRef)
            if (snap.exists()) {
              const data = snap.data()
              const userData: UserData = {
                userId: data.userId,
                phoneNumber: data.phoneNumber ?? '',
                displayName: data.displayName,
                role: data.role,
                createdAt: data.createdAt,
                uids: data.uids ?? [],
              }
              useUserStore.getState().setUserData(userData)
              alert('✅ 네이버 계정으로 연동 완료')
            }          
          }
        }
      } catch (error: any) {
        console.error('❌ 네이버 로그인 실패:', error)
        alert('네이버 로그인 오류: ' + error.message)
      } finally {
        if (!hasRedirected.current) {
          router.replace('/')
        }

        setLoading(false);
      }
    })

    return () => unsubscribe()
  }, [searchParams, router])

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
  );
}
