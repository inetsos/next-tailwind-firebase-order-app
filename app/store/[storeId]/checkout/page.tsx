'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/context/CartContext';
import CartView from '@/components/CartView';
import { createOrderWithTransaction } from '@/utils/order';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import EmailAuthModal from '@/components/EmailAuthModal';

export default function CheckoutPage() {
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const router = useRouter();
  const { carts, clearCart } = useCart();
  const { user } = useAuth();
  const { userData, setPrevPath, isLoginModalOpen, setLoginModalOpen } = useUserStore();

  const [requestNote, setRequestNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = useMemo(() => {
    if (!storeId) return [];
    return carts[storeId] || [];
  }, [carts, storeId]);

  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

  useEffect(() => {
    if (!user) {
      setPrevPath(`/store/${storeId}/checkout`);
      setLoginModalOpen(true); // 🔹 모달 열기
    }
    else {
      setPrevPath(null);
      setLoginModalOpen(false); // 🔹 모달 닫기
    }
  }, [user, storeId, setPrevPath, setLoginModalOpen]);

  // 매장 ID 없으면 홈으로
  useEffect(() => {
    if (!storeId) {
      alert('잘못된 접근입니다.');
      router.push('/');
    }
  }, [storeId, router]);

  // 로그인 여부 체크
  useEffect(() => {
    if (!user) {
      // ✅ 로그인 전 현재 경로 저장
      setPrevPath(`/store/${storeId}/checkout`);
      setLoginModalOpen(true);
    }
    else {
      setPrevPath(null);
      setLoginModalOpen(false);
    }
  }, [user, storeId, setPrevPath]);

  const handleOrderSubmit = async () => {
    
    if (!user || !userData) {
      alert('로그인 후 주문해주세요.');
      setPrevPath(`/store/${storeId}/checkout`);
      setLoginModalOpen(true); // 🔹 모달 열기
      return;
    }
    else {
      setPrevPath(null);
      setLoginModalOpen(false); // 🔹 모달 열기
    }

    if (!items || items.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    if (!storeId) {
      alert('주문할 매장을 선택해주세요.');
      router.push('/');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        userId: userData.userId,
        userPhone: userData.phoneNumber ?? '',
        storeId,
        storeName: items[0].storeName,
        items,
        totalPrice,
        status: '접수' as const,
        requestNote,
      };

      const { orderNumber } = await createOrderWithTransaction(orderData);

      clearCart(storeId);

      router.push(`/store/${storeId}/order-complete?orderNumber=${orderNumber}`);
    } catch (error: any) {
      console.error(error);
      alert(`주문 처리 중 오류 발생: ${error.message || '알 수 없는 오류입니다.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p>장바구니가 비어 있습니다.</p>
        <button
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => router.push(`/store/${storeId}`)}
        >
          메뉴 보러가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">주문 확인</h1>

      <CartView cartItems={items} editable={false} />

      <div className="mt-2">
        <label className="block font-medium mb-2">요청사항</label>
        <textarea
          value={requestNote}
          onChange={(e) => setRequestNote(e.target.value)}
          placeholder="예: 덜 맵게 해주세요."
          className="w-full border rounded p-2"
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className="mt-4 font-semibold text-lg">
        총 결제금액: {totalPrice.toLocaleString()}원
      </div>

      <button
        onClick={handleOrderSubmit}
        disabled={isSubmitting}
        className={`mt-4 w-full py-2 rounded text-white ${
          isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? '주문 처리 중...' : '주문하기'}
      </button>

      {/* 로그인 모달 */}
      {isLoginModalOpen && (
        <EmailAuthModal
          isOpen={isLoginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          redirectTo={`/store/${storeId}/checkout`}
        />
      )}
    </div>
  );
}
