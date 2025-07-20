'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Order } from '@/types/order';

export default function StoreOrdersPage() {
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      alert('잘못된 접근입니다.');
      router.push(`/store`);
      return;
    }

    const fetchTodayOrders = async () => {
      setLoading(true);

      try {
        // 오늘 0시 ~ 내일 0시 Timestamp 범위 계산
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const ordersRef = collection(db, 'stores', storeId, 'orders');
        const q = query(
          ordersRef,
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<', Timestamp.fromDate(end)),
          orderBy('createdAt', 'desc')
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

    fetchTodayOrders();
  }, [storeId, router]);

  if (loading) return <p className="text-center py-10 text-gray-700 dark:text-gray-300">로딩 중...</p>;
  if (orders.length === 0)
    return <p className="text-center py-10 text-gray-700 dark:text-gray-300">오늘 주문이 없습니다.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 min-h-screen">
      <h4 className="text-xl font-bold mt-2 mb-4 text-gray-900 dark:text-gray-100">주문 목록</h4>
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
                <p><strong>주문자 ID:</strong> {order.userId}</p>
                <p><strong>상태:</strong> {order.status}</p>
              </div>
              <div className="text-right">
                <p>{order.createdAt?.toDate?.().toLocaleTimeString() || '-'}</p>
                <p className="font-semibold">{order.totalPrice.toLocaleString()}원</p>
              </div>
            </div>

            {/* 주문 상품 리스트 */}
            <ul className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              {order.items.map((item) => (
                <li key={item.menuId} className="mb-3">
                  <div>
                    <span className="font-semibold">{item.name}</span> x {item.quantity} = {(item.totalPrice * item.quantity).toLocaleString()}원
                  </div>

                  {/* 기본 가격 라벨과 가격 */}
                  <div className="ml-4 text-xs text-gray-600 dark:text-gray-400">
                    기본: {item.baseLabel} - ₩{item.basePrice.toLocaleString()}
                  </div>

                  {/* 필수 옵션 */}
                  {item.requiredOptions.length > 0 && (
                    <ul className="ml-4 mt-1 text-xs list-disc list-inside">
                      {item.requiredOptions.map((opt, i) => (
                        <li key={i} className="dark:text-gray-300">
                          [필수] {opt.groupName}: {opt.option.name} (+₩{opt.option.price.toLocaleString()})
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* 선택 옵션 */}
                  {item.optionalOptions.length > 0 && (
                    <ul className="ml-4 mt-1 text-xs list-disc list-inside">
                      {item.optionalOptions.map((group, i) => (
                        <li key={i} className="dark:text-gray-300">
                          [선택] {group.groupName}: {group.options.map((opt, j) => (
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
    </div>
  );
}
