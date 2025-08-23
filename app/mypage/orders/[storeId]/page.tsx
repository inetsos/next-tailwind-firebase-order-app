'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Order } from '@/types/order';
import { useAuth } from '@/hooks/useAuth';
import dayjs from 'dayjs';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/stores/userStore';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { userData } = useUserStore();
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const searchParams = useSearchParams();
  const storeName = searchParams.get('storeName') ?? '알 수 없음';
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid || !storeId || !userData?.userId) return;

      setLoading(true);
      try {
        const start = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        const end = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate() + 1
        );

        const ordersRef = collection(db, 'stores', storeId, 'orders');
        const q = query(
          ordersRef,
          where('userId', '==', userData?.userId),
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<', Timestamp.fromDate(end)),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const orderList: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          storeId,          // storeId를 명시적으로 추가
          ...doc.data(),
        })) as Order[];

        setOrders(orderList);
      } catch (error) {
        console.error(error);
        alert('주문 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.uid, selectedDate, storeId, userData?.userId])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  const goToPrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const totalPriceSum = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    const status = order.status || '기타';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto p-2 bg-white dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <Link
          href={`/mypage/orders/${storeId}/message?storeName=${encodeURIComponent(storeName)}`}
          className="text-blue-600 hover:underline font-medium"
        >
          ✉️ 주인장에게 메시지 보내기
        </Link>
        
        <Link
          href="/mypage/orders"
          className="text-blue-600 hover:underline font-medium"
        >
          ← 내 주문 보기
        </Link>
      </div>

      <h4 className="text-xl font-bold mt-2 mb-1 text-gray-900 dark:text-gray-100">내 주문 내역 - { storeName }</h4>

      {!user?.uid ? (
        <p className="text-center py-10 text-gray-600 dark:text-gray-400">로그인이 필요합니다.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            총 {orders.length.toLocaleString()}건
            <span className="mx-2">|</span>
            총 금액: {totalPriceSum.toLocaleString()} 원
            {Object.entries(statusCounts).map(([status, count]) => (
              <span key={status} className="ml-2">
                | {status} {count}건
              </span>
            ))}
          </p>

          <div className="flex items-center justify-between mb-6 gap-2">
            <button
              onClick={goToPrevDay}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ◀ 이전
            </button>

            <input
              type="date"
              value={dayjs(selectedDate).format('YYYY-MM-DD')}
              onChange={handleDateChange}
              className="border px-3 py-2 rounded dark:bg-gray-800 dark:text-white"
            />

            <button
              onClick={goToNextDay}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              다음 ▶
            </button>
          </div>

          {loading ? (
            <p className="text-center py-10 text-gray-700 dark:text-gray-300">로딩 중...</p>
          ) : orders.length === 0 ? (
            <p className="text-center py-10 text-gray-700 dark:text-gray-300">
              해당 날짜의 주문이 없습니다.
            </p>
          ) : (
            <ul>
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="mb-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg transition text-gray-900 dark:text-gray-100"
                >
                  <div className="mb-2 font-semibold text-gray-800 dark:text-gray-100">
                    주문번호: {order.orderNumber}
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p><strong>상태:</strong> {order.status}</p>
                    </div>
                    <div className="text-right">
                      <p>{order.createdAt?.toDate?.().toLocaleTimeString() || '-'}</p>
                      <p className="font-semibold">{order.totalPrice.toLocaleString()}원</p>
                    </div>
                  </div>

                  <ul className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {order.items.map((item) => (
                      <li key={item.menuId} className="mb-3">
                        <div className="my-3 h-px bg-gray-300 dark:bg-gray-600" />
                        <div>
                          <span className="font-semibold">- {item.name}</span> x {item.quantity} = {(item.totalPrice).toLocaleString()}원
                        </div>
                        <div className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                          기본: {item.baseLabel} - ₩{item.basePrice.toLocaleString()}
                        </div>

                        {item.requiredOptions.length > 0 && (
                          <ul className="ml-4 mt-1 text-sm list-disc list-inside">
                            {item.requiredOptions.map((opt, i) => (
                              <li key={i} className="dark:text-gray-300">
                                [필수] {opt.groupName}: {opt.option.name} (+₩{opt.option.price.toLocaleString()})
                              </li>
                            ))}
                          </ul>
                        )}

                        {item.optionalOptions.length > 0 && (
                          <ul className="ml-4 mt-1 text-sm list-disc list-inside">
                            {item.optionalOptions.map((group, i) => (
                              <li key={i} className="dark:text-gray-300">
                                [선택] {group.groupName}:{' '}
                                {group.options.map((opt, j) => (
                                  <span key={j}>
                                    {opt.name} (+₩{opt.price.toLocaleString()})
                                    {j < group.options.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
