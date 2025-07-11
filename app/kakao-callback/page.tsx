'use client'

import { useEffect, useRef } from 'react'
import { auth, db } from '@/firebase/firebaseConfig'
import {
  signInWithCustomToken,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useRouter, useSearchParams } from 'next/navigation'
import { doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, 
  serverTimestamp, query, collection, where  } from 'firebase/firestore'
import { useUserStore } from '@/stores/userStore'
import type { UserData } from '@/types/UserData'

export default function KakaoCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const hasRun = useRef(false)
  const hasRedirected = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code || hasRun.current) return

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (hasRun.current) return
      hasRun.current = true   // onAuthStateChanged 상태변화로 재실행시 중복 실행 방지.

      try {
        const functions = getFunctions(undefined, 'asia-northeast3')
        const kakaoLogin = httpsCallable(functions, 'kakaoLogin')
        const result: any = await kakaoLogin({ code })

        const { firebaseToken, kakaoUid, nickname } = result.data

        let currentUser: User

        if (!user) {
          // 🔑 로그인되지 않았으면 Custom Token으로 로그인
          const signInResult = await signInWithCustomToken(auth, firebaseToken)
          currentUser = signInResult.user

          const q = query(
            collection(db, 'users'),
            where('uids', 'array-contains', currentUser.uid)
          );
          const snapshot = await getDocs(q);
  
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const data = docSnap.data();

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
          else
          {
            alert('✅ 카카오 계정이 연결되어 있지 않습니다.\n전화번호 인증 후 로그인 계정 연동해야 합니다.');
            // 🔒 로그아웃 처리
            await auth.signOut();
            hasRedirected.current = true;
            router.replace('/?login=true');
            return;
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

        } else {
          // 🔗 이미 로그인된 상태면 연결만 수행
          // 마이페이지에서 카카오 로그인 연동 시도....
          currentUser = user
          console.log('이미 로그인된 사용자:', currentUser.uid)

          // 사용자 문서에 kakaoUid 추가
          const userRef = doc(db, 'users', currentUser.uid)
          await updateDoc(userRef, {
            uids: arrayUnion(kakaoUid),
          })
        
          // 상태 저장
          const finalSnap = await getDoc(userRef)
          if (finalSnap.exists()) {
            const data = finalSnap.data()
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

          alert('✅ 카카오 계정으로 로그인 되었습니다')          
        }
      } catch (error: any) {
        console.error('❌ 카카오 로그인 실패:', error)
        alert(`카카오 로그인 중 오류 발생: ${error.message}`)
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
      <h2>카카오 계정 로그인 중...</h2>
      <p>잠시만 기다려주세요 🔄</p>
    </div>
  )
}
