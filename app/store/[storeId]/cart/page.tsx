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
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4">
      <CartView
        cartItems={items}
        onQuantityChange={handleQuantityChange}
        onRemoveItem={handleRemoveItem}
      />

      {items.length > 0 && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => storeId && clearCart(storeId)}
            className="btn btn-red"
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
            className="btn btn-green"
          >
            메뉴 추가
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
            className="btn btn-green"
          >
            메뉴 추가
          </button>
        </div>
      )}

      <style jsx>{`
        .btn {
          width: 160px;
          height: 40px;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: background-color 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          user-select: none;
          border: none;
        }
        .btn-red {
          background-color: #ef4444;
          color: white;
        }
        .btn-red:hover {
          background-color: #dc2626;
        }
        .btn-green {
          background-color: #16a34a;
          color: white;
        }
        .btn-green:hover {
          background-color: #15803d;
        }
      `}</style>
    </div>
  );
}
