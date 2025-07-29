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
import { v4 as uuidv4 } from 'uuid';

interface CartContextType {
  carts: { [storeId: string]: CartItem[] };
  currentStoreId: string | null;
  items: CartItem[];
  addItem: (storeId: string, item: CartItem) => void;
  removeItem: (storeId: string, itemId: string) => void;
  clearCart: (storeId: string) => void;
  updateItemQuantity: (storeId: string, itemId: string, quantity: number) => void;
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

  const removeItem = (storeId: string, itemId: string) => {
    setCarts(prev => {
      const updated = (prev[storeId] || []).filter(item => item.id !== itemId);
      return { ...prev, [storeId]: updated };
    });
  };

  const updateItemQuantity = (storeId: string, itemId: string, quantity: number) => {
    setCarts(prev => {
      const updated = (prev[storeId] || []).map(item => {
        if (item.id === itemId) {
          const requiredOptionTotal = item.requiredOptions.reduce(
            (sum, opt) => sum + opt.option.price, 0);
          const optionalOptionTotal = item.optionalOptions.reduce(
            (sum, group) => sum + group.options.reduce(
              (innerSum, o) => innerSum + o.price, 0),
            0
          );
          const newTotal = (item.basePrice + requiredOptionTotal + optionalOptionTotal) * quantity;

          return { ...item, quantity, totalPrice: newTotal };
        }
        return item;
      });
      return { ...prev, [storeId]: updated };
    });
  };

  const clearCart = (storeId: string) => {
    setCarts(prev => ({ ...prev, [storeId]: [] }));
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
