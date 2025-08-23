'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserData } from '@/types/UserData';
import type { User } from 'firebase/auth';

interface UserStore {
  userData: UserData | null;
  firebaseUser: User | null;      // 로그인 유저 객체
  prevPath: string | null;        // 로그인 전 경로 저장
  isLoginModalOpen: boolean;      // 로그인 모달 상태
  hasHydrated: boolean;           // persist 완료 여부

  // 액션
  setUserData: (data: UserData) => void;
  setFirebaseUser: (user: User | null) => void;
  setPrevPath: (path: string | null) => void;
  setLoginModalOpen: (open: boolean) => void;
  clearUserData: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userData: null,
      firebaseUser: null,   // persist 제외
      prevPath: null,
      isLoginModalOpen: false,
      hasHydrated: false,

      setUserData: (data) => set({ userData: data }),
      setFirebaseUser: (user) => set({ firebaseUser: user }),
      setPrevPath: (path) => {
        console.log('🔙 prevPath 저장:', path);
        set({ prevPath: path });
      },
      setLoginModalOpen: (open) => set({ isLoginModalOpen: open }),
      clearUserData: () =>
        set((state) => ({
          userData: null,
          firebaseUser: null,
          prevPath: state.prevPath, // 유지
          isLoginModalOpen: false,
        })),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        userData: state.userData,
        prevPath: state.prevPath,
        isLoginModalOpen: state.isLoginModalOpen,
        //hasHydrated: state.hasHydrated,
        // firebaseUser는 저장하지 않음
      }),
      onRehydrateStorage: () => (state, error) => {
        if (state) state.setHasHydrated(true);
        if (error) console.error("rehydrate error", error);
      },
    }
  )
);
