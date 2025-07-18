'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '@/types/cart';

interface CartContextType {
  carts: { [storeId: string]: CartItem[] };
  currentStoreId: string | null;
  items: CartItem[]; // 현재 선택된 매장 장바구니 아이템 배열 추가
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

  useEffect(() => {
    console.log('🛒 carts 상태 변경:', carts);
    console.log('🏪 currentStoreId:', currentStoreId);
    console.log('🛍️ 현재 items:', currentStoreId ? carts[currentStoreId] : []);
  }, [carts, currentStoreId]);

  const addItem = (storeId: string, item: CartItem) => {
    setCarts(prev => {
      const existing = prev[storeId] || [];
      return { ...prev, [storeId]: [...existing, item] };
    });

    if (!currentStoreId) {
      setCurrentStoreId(storeId);
    }
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

  // currentStoreId에 해당하는 장바구니 배열 반환 (없으면 빈 배열)
  const items = currentStoreId ? carts[currentStoreId] || [] : [];

  return (
    <CartContext.Provider
      value={{ carts, currentStoreId, items, addItem, removeItem, clearCart, updateItemQuantity, switchStore }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
