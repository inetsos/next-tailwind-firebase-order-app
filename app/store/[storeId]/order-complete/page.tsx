'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function OrderCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 쿼리에서 orderId와 storeId 받아오기
  const orderNumber = searchParams.get('orderNumber');
  const storeId = searchParams.get('storeId');

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-6 text-green-600">주문이 완료되었습니다!</h1>

      {orderNumber && (
        <p className="mb-4 text-lg">
          주문번호: <span className="font-mono">{orderNumber}</span>
        </p>
      )}

      <p className="mb-8">
        고객님의 소중한 주문을 확인했습니다.<br/>
        정성을 다하여 준비해드릴게요!
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          홈으로 가기
        </button>

        {storeId && (
          <button
            onClick={() => router.push(`/store/${storeId}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            매장으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}
