'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/context/CartContext';
import CartView from '@/components/CartView';
import { createOrderWithTransaction } from '@/utils/order';
import { useAuth } from '@/hooks/useAuth';  // 로그인 유저 정보 가져오는 커스텀 훅

export default function CheckoutPage() {
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const router = useRouter();
  const [requestNote, setRequestNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { carts, clearCart } = useCart();
  const { user } = useAuth();

  const items = useMemo(() => {
    if (!storeId || typeof storeId !== 'string') return [];
    return carts[storeId] || [];
  }, [carts, storeId]);

  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);

  useEffect(() => {
    if (!storeId || typeof storeId !== 'string') {
      alert('잘못된 접근입니다.');
      router.push('/');
    }
  }, [storeId, router]);

  const handleOrderSubmit = async () => {
    if (isSubmitting) return; // 중복 방지

    if (!user) {
      alert('로그인 후 주문해주세요.');
      return;
    }
    if (!storeId) {
      alert('주문할 매장을 선택해주세요.');
      return;
    }
    if (!items || items.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        userId: user.uid,
        storeId: storeId,
        storeName: items[0].storeName,
        items,
        totalPrice,
        status: '접수' as const,
        requestNote,  // 요청사항 포함
      };

      const { id: orderId, orderNumber } = await createOrderWithTransaction(orderData);
      alert(`주문이 접수되었습니다. 주문번호: ${orderNumber}`);

      clearCart(storeId);

      // 주문 완료 후 이동할 페이지(예: 주문완료 페이지 또는 매장 메인)
      router.push(`/store/${storeId}/order-complete?orderNumber=${orderNumber}`);
    } catch (error) {
      console.error(error);
      alert('주문 처리 중 오류가 발생했습니다.');
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

      <CartView cartItems={items} editable={false}/>

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
    </div>
  );
}
