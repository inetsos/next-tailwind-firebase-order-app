// ✅ userStore.ts
'use client';

import { create } from 'zustand';
import type { UserData } from '@/types/UserData'; // 이 부분 추가

interface UserStore {
  userData: UserData | null;
  setUserData: (data: UserData) => void;
  clearUserData: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userData: null,
  setUserData: (data) => set({ userData: data }),
  clearUserData: () => set({ userData: null }),
}));
