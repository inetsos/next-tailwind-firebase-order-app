'use client'

import { useEffect, useRef } from 'react'
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

export default function NaverCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRun = useRef(false)
  const hasRedirected = useRef(false)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state || hasRun.current) return

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (hasRun.current) return
      hasRun.current = true // onAuthStateChanged 상태 변화로 인한 중복 실행시 재실행 방지

       console.log("222")
      try {
        const functions = getFunctions(undefined, 'asia-northeast3')
        const naverLogin = httpsCallable(functions, 'naverLogin')
        const result: any = await naverLogin({ code, state })
        const { firebaseToken, naverUid, displayName } = result.data

        let currentUser: User

        if (!user) {
          // 🔑 로그인되지 않았으면 커스텀 토큰으로 로그인
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
             console.log("333")
            alert('✅ 네이버 계정이 연결되어 있지 않습니다.\n전화번호 인증 후 로그인 계정 연동해야 합니다.')
            await signOut(auth)
            hasRedirected.current = true
            router.replace('/?login=true')
            return
          }

          // 🔄 이름 없으면 네이버 닉네임으로 저장
          const userData = useUserStore.getState().userData
          if (userData?.userId && (!userData.displayName || userData.displayName.trim() === '')) {
            const userRef = doc(db, 'users', userData.userId)
            await updateDoc(userRef, { displayName })
          }

          console.log('네이버 계정으로 신규 로그인 완료:', currentUser.uid)
        } else {
          // 🔗 이미 로그인된 경우 → uid 연동
          currentUser = user
          console.log('이미 로그인된 사용자:', currentUser.uid)

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
          }

          alert('✅ 네이버 계정으로 연동 완료')
        }
      } catch (error: any) {
        console.error('❌ 네이버 로그인 실패:', error)
        alert('네이버 로그인 오류: ' + error.message)
      } finally {
        if (!hasRedirected.current) {
          router.replace('/')
        }
      }
    })

    return () => unsubscribe()
  }, [searchParams, router])

  return (
    <div className="p-6 text-center">
      <h2>네이버 계정 로그인 중...</h2>
      <p>잠시만 기다려주세요 🔄</p>
    </div>
  )
}
