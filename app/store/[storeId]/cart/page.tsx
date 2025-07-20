'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import CartView from '@/components/CartView';

export default function CartPage() {
  const params = useParams();
  const router = useRouter();

  const rawStoreId = params.storeId;
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const {
    carts,
    currentStoreId,
    removeItem,
    updateItemQuantity,
    clearCart,
    switchStore,
  } = useCart();

  const items = useMemo(() => {
    return storeId ? carts[storeId] || [] : [];
  }, [carts, storeId]);

  useEffect(() => {
    if (!storeId) {
      alert('잘못된 접근입니다.');
      router.push('/');
      return;
    }

    const isSwitchingStore =
      currentStoreId && currentStoreId !== storeId && carts[currentStoreId]?.length > 0;

    if (isSwitchingStore) {
      const storeName = carts[currentStoreId][0]?.storeName || '다른 매장';
      const confirmed = confirm(
        `현재 장바구니는 ${storeName}의 상품이 담겨 있습니다.\n장바구니를 비우고 이 매장으로 전환할까요?`
      );

      if (confirmed) {
        clearCart(currentStoreId);
        switchStore(storeId);
      } else {
        router.back();
      }
    } else {
      switchStore(storeId);
    }
  }, [storeId, currentStoreId, carts, clearCart, switchStore, router]);

  const handleQuantityChange = (menuId: string, quantity: number) => {
    const index = items.findIndex((item) => item.menuId === menuId);
    if (index !== -1 && storeId) {
      updateItemQuantity(storeId, index, quantity);
    }
  };

  const handleRemoveItem = (menuId: string) => {
    const index = items.findIndex((item) => item.menuId === menuId);
    if (index !== -1 && storeId) {
      removeItem(storeId, index);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <CartView
        cartItems={items}
        onQuantityChange={handleQuantityChange}
        onRemoveItem={handleRemoveItem}
      />

      {items.length > 0 && (
        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          <button
            onClick={() => storeId && clearCart(storeId)}
            className="w-40 h-10 text-sm font-semibold rounded-md shadow-md
              bg-red-500 text-white hover:bg-red-600
              dark:bg-red-600 dark:hover:bg-red-700
              transition-colors duration-300"
          >
            장바구니 비우기
          </button>

          <button
            onClick={() => {
              if (storeId) {
                sessionStorage.setItem('scrollToMenu', 'true');
                router.push(`/store/${storeId}`);
              }
            }}
            className="w-40 h-10 text-sm font-semibold rounded-md shadow-md
              bg-green-600 text-white hover:bg-green-700
              dark:bg-green-700 dark:hover:bg-green-800
              transition-colors duration-300"
          >
            메뉴 추가
          </button>

          <button
            onClick={() => {
              if (storeId) {
                sessionStorage.setItem('scrollToMenu', 'true');
                router.push(`/store/${storeId}/checkout`);
              }
            }}
            className="w-40 h-10 text-sm font-semibold rounded-md shadow-md
              bg-blue-600 text-white hover:bg-blue-700
              dark:bg-blue-700 dark:hover:bg-blue-800
              transition-colors duration-300"
          >
            주문하기
          </button>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => {
              if (storeId) {
                sessionStorage.setItem('scrollToMenu', 'true');
                router.push(`/store/${storeId}`);
              }
            }}
            className="w-40 h-10 text-sm font-semibold rounded-md shadow-md
              bg-green-600 text-white hover:bg-green-700
              dark:bg-green-700 dark:hover:bg-green-800
              transition-colors duration-300"
          >
            메뉴 추가
          </button>
        </div>
      )}
    </div>
  );
}
