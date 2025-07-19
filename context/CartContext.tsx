'use client';

import React, {
  createContext, useContext, useState, useEffect, ReactNode
} from 'react';
import { CartItem } from '@/types/cart';
import { useAuth } from '@/hooks/useAuth';
import {
  getCartFromFirestore,
  saveCartToFirestore,
  mergeLocalCartToFirestore
} from '@/utils/cartStorage'; // 아래에서 구현
import { getLocalCart, saveLocalCart, clearLocalCart } from '@/utils/localCart';

interface CartContextType {
  carts: { [storeId: string]: CartItem[] };
  currentStoreId: string | null;
  items: CartItem[];
  addItem: (storeId: string, item: CartItem) => void;
  removeItem: (storeId: string, index: number) => void;
  clearCart: (storeId: string) => void;
  updateItemQuantity: (storeId: string, index: number, quantity: number) => void;
  switchStore: (storeId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [carts, setCarts] = useState<{ [storeId: string]: CartItem[] }>({});
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const { user } = useAuth();

  // -- cart firestore 저장은 실제 서비스할 때 다시 고려한다. --
  // Load cart from localStorage or Firestore
  // useEffect(() => {
  //   const loadCart = async () => {
  //     if (user) {
  //       // 병합 후 Firestore 데이터로 상태 업데이트
  //       const merged = await mergeLocalCartToFirestore(user.uid);
  //       setCarts(merged);
  //       clearLocalCart();
  //     } else {
  //       const localCart = getLocalCart();
  //       setCarts(localCart);
  //     }
  //   };
  //   loadCart();
  // }, [user]);
 
  // useEffect(() => {
  //   // 저장 (localStorage 또는 Firestore)
  //   if (user) {
  //     saveCartToFirestore(user.uid, carts);
  //   } else {
  //     saveLocalCart(carts);
  //   }
  // }, [carts, user]);

  // cart localstorage만 사용
  useEffect(() => {
    const localCart = getLocalCart();
    setCarts(localCart);
  }, []);

  useEffect(() => {
    saveLocalCart(carts);
  }, [carts]);
  // -----------------------------

  const addItem = (storeId: string, item: CartItem) => {
    setCarts(prev => {
      const existing = prev[storeId] || [];
      return { ...prev, [storeId]: [...existing, item] };
    });
    if (!currentStoreId) setCurrentStoreId(storeId);
  };

  const removeItem = (storeId: string, index: number) => {
    setCarts(prev => {
      const updated = [...(prev[storeId] || [])];
      updated.splice(index, 1);
      return { ...prev, [storeId]: updated };
    });
  };

  const clearCart = (storeId: string) => {
    setCarts(prev => ({ ...prev, [storeId]: [] }));
  };

  const updateItemQuantity = (storeId: string, index: number, quantity: number) => {
    setCarts(prev => {
      const updated = [...(prev[storeId] || [])];
      updated[index].quantity = quantity;
      return { ...prev, [storeId]: updated };
    });
  };

  const switchStore = (storeId: string) => {
    setCurrentStoreId(storeId);
  };

  const items = currentStoreId ? carts[currentStoreId] || [] : [];

  return (
    <CartContext.Provider value={{
      carts, currentStoreId, items,
      addItem, removeItem, clearCart, updateItemQuantity, switchStore
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
