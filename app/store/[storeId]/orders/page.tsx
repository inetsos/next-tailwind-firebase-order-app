'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Order } from '@/types/order';
import dayjs from 'dayjs';
import Link from "next/link";

export default function StoreOrdersPage() {
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!storeId) {
      alert('잘못된 접근입니다.');
      router.push(`/store`);
      return;
    }

    const fetchOrders = async () => {
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
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<', Timestamp.fromDate(end)),
          orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        const orderList: Order[] = [];
        snapshot.forEach((doc) => {
          orderList.push({ id: doc.id, ...doc.data() } as Order);
        });

        setOrders(orderList);
      } catch (error) {
        console.error(error);
        alert('주문 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [storeId, selectedDate, router]);

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
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 min-h-screen">
      <div className="mb-4 flex justify-end">
        <Link href={`/store/${storeId}/admin`}>
          <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1">
            ← 매장 운영 관리
          </span>
        </Link>
      </div>
      <h4 className="text-xl font-bold mt-4 mb-4 text-gray-900 dark:text-gray-100">주문 목록</h4>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        총 {orders.length.toLocaleString()}건
        <span className="mx-2">|</span>
        총 금액: {totalPriceSum.toLocaleString()} 원
        {Object.entries(statusCounts).map(([status, count], i, arr) => (
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
        <p className="text-center py-10 text-gray-700 dark:text-gray-300">해당 날짜의 주문이 없습니다.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li
              key={order.id}
              className="mb-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg transition cursor-pointer text-gray-900 dark:text-gray-100"
              onClick={() => router.push(`/store/${storeId}/orders/${order.id}`)}
            >
              <div className="flex justify-between mb-2">
                <div>
                  <p><strong>주문번호:</strong> {order.orderNumber}</p>
                  <p><strong>주문자:</strong> {order.userName}</p>
                  <p>
                    <strong>상태:</strong>{' '}
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-sm font-medium
                        ${
                          order.status === '접수'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === '준비'
                            ? 'bg-green-100 text-green-800'
                            : order.status === '취소'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                    >
                      {order.status}
                    </span>
                  </p>
                  {order.requestNote && (
                    <p className="whitespace-pre-wrap text-sm mt-1">
                      <strong>요청사항:</strong> <br/>
                      <span className="pl-6 block">
                        {order.requestNote}
                      </span>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {/* <p>{order.createdAt?.toDate?.().toLocaleTimeString() || '-'}</p> */}
                  <p>{order.createdAt ? dayjs(order.createdAt.toDate()).format('YYYY-MM-DD HH:mm') : '-'}</p>
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
    </div>
  );
}
