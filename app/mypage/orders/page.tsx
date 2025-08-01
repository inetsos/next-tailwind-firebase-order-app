'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import Link from 'next/link';
import dayjs from 'dayjs';

interface UserOrder {
  id: string;
  storeId: string;
  storeName: string;
  orderedAt: any;
}

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { userData } = useUserStore();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    if (!user || !userData || !selectedDate) return;

    const fetchOrders = async () => {
      const start = selectedDate.startOf('day').toDate(); // 00:00:00
      const end = selectedDate.endOf('day').toDate();     // 23:59:59

      const q = query(
        collection(db, 'users', userData.userId, 'orders'),
        where('orderedAt', '>=', start),
        where('orderedAt', '<=', end),
        orderBy('orderedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const result: UserOrder[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<UserOrder, 'id'>),
      }));

      setOrders(result);
    };

    fetchOrders();
  }, [user, userData, selectedDate]);

  const goToPreviousDay = () => {
    setSelectedDate(prev => prev.subtract(1, 'day'));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => prev.add(1, 'day'));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(dayjs(e.target.value));
  };

  return (
    <main className="max-w-3xl mx-auto p-2 space-y-6">
      <div className="text-end">
        <Link
          href="/mypage"
          className="text-blue-600 hover:underline font-medium"
        >
          ← 마이페이지로
        </Link>
      </div>

      <h1 className="text-2xl font-bold">내 주문 목록</h1>

      {/* 날짜 네비게이션 */}
      <div className="flex items-center gap-2">
        <button
          onClick={goToPreviousDay}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          ◀ 이전
        </button>
        <input
          type="date"
          value={selectedDate.format('YYYY-MM-DD')}
          onChange={handleDateChange}
          className="border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600"
        />
        <button
          onClick={goToNextDay}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          다음 ▶
        </button>
      </div>

      {/* 주문 목록 */}
      {orders.length === 0 ? (
        <p className="text-gray-500">이 날짜에는 주문 내역이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map(order => (
            <li key={order.id} className="p-4 rounded bg-white dark:bg-gray-800 shadow">
              <Link
                href={`/mypage/orders/${order.storeId}?storeName=${encodeURIComponent(order.storeName)}`}
              >
                <div className="font-semibold hover:underline cursor-pointer">{order.storeName}</div>
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-300">
                주문일: {order.orderedAt?.toDate?.().toLocaleString() ?? '알 수 없음'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
