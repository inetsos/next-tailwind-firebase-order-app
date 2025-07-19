// utils/localCart.ts

import { CartItem } from '@/types/cart';

export const LOCAL_CART_KEY = 'cart_by_store';

// 장바구니 불러오기
export const getLocalCart = (): Record<string, CartItem[]> => {
  if (typeof window === 'undefined') return {};

  try {
    const data = localStorage.getItem(LOCAL_CART_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);

    // 유효성 검사 (간단한 구조만 체크)
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return parsed;
  } catch (error) {
    console.error('장바구니 데이터를 불러오는 중 오류 발생:', error);
    return {};
  }
};

// 장바구니 저장
export const saveLocalCart = (carts: Record<string, CartItem[]>) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(carts));
  } catch (error) {
    console.error('장바구니 데이터를 저장하는 중 오류 발생:', error);
  }
};

// 장바구니 삭제
export const clearLocalCart = () => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(LOCAL_CART_KEY);
  } catch (error) {
    console.error('장바구니 데이터를 삭제하는 중 오류 발생:', error);
  }
};
