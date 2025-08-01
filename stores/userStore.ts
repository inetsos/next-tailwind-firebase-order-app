'use client';

import { create } from 'zustand';
import type { UserData } from '@/types/UserData';
import type { User } from 'firebase/auth';

interface UserStore {
  userData: UserData | null;
  firebaseUser: User | null;
  setUserData: (data: UserData) => void;
  setFirebaseUser: (user: User | null) => void;
  clearUserData: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userData: null,
  firebaseUser: null,
  setUserData: (data) => set({ userData: data }),
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  clearUserData: () => set({ userData: null, firebaseUser: null }),
}));
