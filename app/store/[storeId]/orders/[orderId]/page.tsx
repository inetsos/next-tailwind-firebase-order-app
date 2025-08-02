'use client';

import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { doc, getDoc, updateDoc,
  collection, addDoc, serverTimestamp
 } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Order } from '@/types/order';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PrinterIcon } from '@heroicons/react/24/solid';

export default function OrderReceipt() {
  const { storeId, orderId } = useParams() as { storeId: string; orderId: string };

  const contentRef  = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // 주문 데이터 가져오기
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = doc(db, 'stores', storeId, 'orders', orderId);
        const snapshot = await getDoc(orderDoc);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setOrder({
            id: snapshot.id,
            ...data,
          } as Order);
        } else {
          alert('주문 정보를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error(error);
        alert('주문 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [storeId, orderId]);

  const handleChangeStatus = async (newStatus: Order['status']) => {
    if (!order?.id || !order.userId || !order.storeName) return;

    const orderRef = doc(db, 'stores', storeId, 'orders', orderId);
    await updateDoc(orderRef, { status: newStatus });
    setOrder((prev) => prev && { ...prev, status: newStatus });

    // 🔽 메시지 저장 추가
    const messageText = `${order.storeName} - 주문이 "${newStatus}" 상태로 변경되었습니다.`;
    const messageRef = collection(db, 'users', order.userId, 'orderMessages');

    await addDoc(messageRef, {
      orderNumber: order.orderNumber,
      storeId,
      storeName: order.storeName,
      status: newStatus,
      message: messageText,
      createdAt: serverTimestamp(),
      read: false,
    });
  };

  if (loading) return <p className="text-center py-10">로딩 중...</p>;
  if (!order) return <p className="text-center py-10">주문이 존재하지 않습니다.</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 text-gray-900 dark:text-white">
      <div>        
        {/* 인쇄 영역 */}
        <div
          ref={contentRef}
          className="p-6 mt-4 mb-0 rounded-lg print:block bg-white text-black"
        >
          <h4 className="text-lg font-bold mb-2">
            주문번호: {order.orderNumber ?? order.id}
          </h4>
          {order.userPhone && (
            <p className="text-base mb-1">주문자: {order.userPhone}</p>
          )}
          <p className="text-sm mb-1 flex items-center gap-2">
            상태:
            <span
              className={`px-2 py-0.5 rounded-full text-sm font-semibold
                ${order.status === '접수' ? 'bg-blue-100 text-blue-800' :
                  order.status === '준비' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === '픽업' ? 'bg-green-100 text-green-800' :
                  order.status === '취소' ? 'bg-red-100 text-red-800' : ''}
              `}
            >
              {order.status}
            </span>
          </p>
          <p className="text-sm mb-1">
            주문:{' '}
            {order.createdAt?.toDate?.()
              ? dayjs(order.createdAt.toDate()).locale('ko').format('YYYY-MM-DD HH:mm')
              : '-'}
          </p>
          {order.requestNote && (
            <p className="whitespace-pre-wrap text-sm mt-1">
              요청사항:<br/>
              <span className="pl-6 block">
                {order.requestNote}
              </span>
            </p>
          )}

          <hr className="my-3 border-t" />

          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="text-sm">
                <div className="font-semibold">
                  {item.name} × {item.quantity}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {item.baseLabel} - {item.basePrice.toLocaleString()}원
                </div>

                {/* 필수 옵션 */}
                {item.requiredOptions.map((req, idx) => (
                  <div key={idx} className="text-sm ml-2">
                    ▸ {req.groupName}: {req.option.name} (+{req.option.price}원)
                  </div>
                ))}

                {/* 선택 옵션 */}
                {item.optionalOptions.map((opt, idx) => (
                  <div key={idx} className="text-sm ml-2">
                    ▸ {opt.groupName}:{' '}
                    {opt.options.map((o) => `${o.name} (+${o.price}원)`).join(', ')}
                  </div>
                ))}

                <div className="text-right text-sm font-medium mt-1">
                  합계: {item.totalPrice.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>

          <hr className="my-3 border-t" />

          <div className="text-right font-bold text-lg">
            총 결제 금액: {order.totalPrice.toLocaleString()}원
          </div>
        </div>       

        <div className="flex justify-center print:hidden">
          <button 
            onClick={reactToPrintFn}
            className="flex flex-row items-center mt-2 gap-1 px-3 py-1.5 rounded-full text-xs font-medium border
                     bg-white text-gray-700 border-gray-300 hover:bg-gray-100 active:bg-gray-200 
                     transition-all duration-200 print:hidden"
          >
              <PrinterIcon className="w-5 h-5" /> 인쇄
          </button>
        </div>

        {(order.status === '접수' || order.status === '준비') && (
          <p className="text-sm mb-1 mt-2">
            주문 시간:{' '}
            {order.createdAt?.toDate?.()
              ? `${dayjs(order.createdAt.toDate()).locale('ko').format('YYYY-MM-DD HH:mm')} (${dayjs().diff(dayjs(order.createdAt.toDate()), 'minute')}분 경과)`
              : '-'}
          </p>
        )}


        <div className="flex flex-wrap gap-2 mt-6 justify-center print:hidden">
          {['접수', '준비', '픽업', '취소'].map((label) => {
            const statusValue = label as Order['status'];
            return (
              <button
                key={statusValue}
                onClick={() => handleChangeStatus(statusValue)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200
                  ${
                    order.status === statusValue
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 active:bg-gray-200'
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 주문 목록으로 가기 링크 - 하단 */}
      <div className="mt-6 text-center print:hidden">
        <Link
          href={`/store/${storeId}/orders`}
          className="text-sm text-blue-600 underline hover:text-blue-800 font-medium"
        >
          주문 목록으로
        </Link>
      </div>
    </div>
  );
}
