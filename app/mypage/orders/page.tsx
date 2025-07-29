// app/mypage/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/hooks/useAuth'; // 로그인 유저 가져오는 훅
import { useUserStore } from '@/stores/userStore';
import Link from 'next/link';

interface UserOrder {
  id: string;
  storeId: string;
  storeName: string;
  orderedAt: any;
}

export default function MyOrdersPage() {
  const { user } = useAuth(); // 현재 로그인된 유저
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const { userData } = useUserStore();

  useEffect(() => {
    if (!user || !userData) return;

    const fetchOrders = async () => {
      const q = query(
        collection(db, 'users', userData.userId, 'orders'),
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
  }, [user]);

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="text-end">
        <Link
          href="/mypage"
          className="text-blue-600 hover:underline font-medium"
        >
          ← 마이페이지로
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-4">내 주문 목록</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">주문 내역이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map(order => (
            <li key={order.id} className="p-4 rounded bg-white dark:bg-gray-800 shadow">
              {/* 필요 시 상세보기 버튼 추가 가능 */}
              <Link href={`/mypage/orders/${order.storeId}?storeName=${encodeURIComponent(order.storeName)}`}>
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
