import { create } from 'zustand';
import { Store } from '@/types/store';

interface StoreState {
  store: Store | null;
  setStore: (store: Store | null) => void;
  isInitialized: boolean;           // 초기화 완료 여부 상태 추가
  setInitialized: (v: boolean) => void;
}

export const useStoreStore = create<StoreState>((set) => ({
  store: null,
  setStore: (store) => set({ store }),
  isInitialized: false,
  setInitialized: (v) => set({ isInitialized: v }),
}));
