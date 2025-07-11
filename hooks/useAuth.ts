'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserStore } from '@/stores/userStore';

interface UserData {
  userId: string;
  phoneNumber: string;
  displayName?: string;
  role?: string;
  createdAt?: any;
  email?: string;
  uids: string[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const { setUserData, clearUserData } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const q = query(
          collection(db, 'users'),
          where('uids', 'array-contains', firebaseUser.uid)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data(); 
          // 유효성 검사 후 상태 저장
          if (
            typeof data.userId === 'string' &&
            typeof data.phoneNumber === 'string' &&
            Array.isArray(data.uids)
          ) {
            const userData: UserData = {
              userId: data.userId,
              phoneNumber: data.phoneNumber,
              displayName: data.displayName || '',
              role: data.role || 'customer',
              createdAt: data.createdAt,
              email: data.email || '',
              uids: data.uids,
            };

            setUserData(userData);
          } else {
            console.warn('유효하지 않은 사용자 데이터:', data);
            clearUserData();
          }
        } else {
          clearUserData();
        }
      } else {
        clearUserData();
      }
    });

    return () => unsubscribe();
  }, []);

  return { user };
}
