'use client';

import { create } from 'zustand';

export interface UserData {
  userId: string;
  phoneNumber: string;
  displayName?: string;
  role?: string;
  createdAt?: any;
  email?: string;
  uids: string[];
}

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
