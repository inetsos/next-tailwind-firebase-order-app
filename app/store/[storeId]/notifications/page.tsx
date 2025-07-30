'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getNotifications } from '@/utils/notifications';
import { Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import dayjs from 'dayjs';
import Link from "next/link";

interface Notification {
  id: string;
  message: string;
  startDate: Timestamp;
  endDate: Timestamp;
}

export default function NotificationListPage() {
  const { storeId } = useParams();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    if (typeof storeId !== 'string') return;
    setLoading(true);
    const list = await getNotifications(storeId);
    setNotifications(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, [storeId]);

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('정말 삭제하시겠습니까?');
    if (!confirm) return;

    await deleteDoc(doc(db, 'stores', storeId as string, 'notifications', id));
    await fetchList();
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mt-4 flex justify-end">
        <Link href={`/store/${storeId}/admin`}>
          <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700 
                          transition flex items-center gap-1">
            ← 매장 운영 관리
          </span>
        </Link>
      </div>
      <h1 className="text-xl font-bold mb-4">고객 알림 목록</h1>

      <button
        onClick={() => router.push(`/store/${storeId}/notifications/new`)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded shadow text-sm"
      >
        ➕ 새 알림 등록
      </button>

      {loading ? (
        <p>불러오는 중...</p>
      ) : notifications.length === 0 ? (
        <p>등록된 알림이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="border rounded p-4 flex justify-between items-center gap-4"
            >
              <div className="text-sm">
                <p className="font-medium whitespace-pre-line">{n.message}</p>
                <p className="text-gray-500 mt-1">
                  📅 {dayjs(n.startDate.toDate()).format('YYYY.MM.DD')} ~{' '}
                  {dayjs(n.endDate.toDate()).format('YYYY.MM.DD')}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-red-600 underline"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
