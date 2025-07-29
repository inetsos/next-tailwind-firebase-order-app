'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  orderBy,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import dayjs from 'dayjs';
import { useUserStore } from '@/stores/userStore';
import Link from 'next/link';

interface OrderMessage {
  id: string;
  message: string;
  createdAt: string;
  orderNumber: string;
  status: string;
  storeId: string; 
  storeName: string;
}

interface FirestoreOrderMessage {
  message: string;
  createdAt: Timestamp;
  orderNumber: string;
  status: string;
  storeId: string;
  storeName: string;
}

export default function MyOrderMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const { userData } = useUserStore();

  const fetchMessages = async (date: dayjs.Dayjs) => {
    if (!user || !userData) return;

    setLoading(true);
    try {
      const start = Timestamp.fromDate(date.startOf('day').toDate());
      const end = Timestamp.fromDate(date.endOf('day').toDate());

      const q = query(
        collection(db, 'users', userData.userId, 'orderMessages'),
        where('createdAt', '>=', start),
        where('createdAt', '<=', end),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const data: OrderMessage[] = snapshot.docs.map((doc) => {
        const docData = doc.data() as FirestoreOrderMessage;
        return {
          id: doc.id,
          message: docData.message,
          createdAt: docData.createdAt?.toDate?.()
            ? dayjs(docData.createdAt.toDate()).format('YYYY-MM-DD HH:mm')
            : '-',
          orderNumber: docData.orderNumber,
          status: docData.status,
          storeId: docData.storeId,      
          storeName: docData.storeName,  
        };
      });

      setMessages(data);
    } catch (error) {
      console.error('메시지 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages(selectedDate);
    }
  }, [user, selectedDate]);

  const handlePrevDay = () => {
    setSelectedDate((prev) => prev.subtract(1, 'day'));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => prev.add(1, 'day'));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedDate(dayjs(value));
  };

  if (!user)
    return (
      <p className="text-center p-4 text-gray-500 dark:text-gray-400">
        로그인이 필요합니다.
      </p>
    );

  return (
    <div className="max-w-md mx-auto mt-4 p-4 rounded-xl shadow bg-white dark:bg-gray-800 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">주문 상태 메시지</h2>

      {/* 날짜 선택 UI */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={handlePrevDay} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
          ◀ 이전
        </button>
        <input
          type="date"
          value={selectedDate.format('YYYY-MM-DD')}
          onChange={handleDateChange}
          className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
        />
        <button onClick={handleNextDay} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
          다음 ▶
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">불러오는 중...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">알림 메시지가 없습니다.</p>
      ) : (
        <ul className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
        {messages.map((msg) => (
          <li key={msg.id}>
            <Link
              href={`/mypage/orders/${msg.storeId}?storeName=${encodeURIComponent(msg.storeName)}`}
              className="block p-3 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <p>{msg.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                주문번호: {msg.orderNumber} | 상태: {msg.status} | <strong>{msg.createdAt}</strong>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      )}
    </div>
  );
}
