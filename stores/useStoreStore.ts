import { create } from 'zustand';
import { Store } from '@/types/store';

interface StoreState {
  store: Store | null;
  setStore: (store: Store | null) => void;
}

export const useStoreStore = create<StoreState>((set) => ({
  store: null,
  setStore: (store) => set({ store }),
}));
