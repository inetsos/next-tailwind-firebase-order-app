'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Store } from '@/types/store';
import { useUserStore } from '@/stores/userStore';

export default function StoreManagePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userData } = useUserStore();

  useEffect(() => {
    if (!userData?.userId) return;

    const fetchStores = async () => {
      try {
        const q = query(collection(db, 'stores'), where('admin', '==', userData.userId));
        const querySnapshot = await getDocs(q);
        const storeList: Store[] = [];
        querySnapshot.forEach(doc => {
          storeList.push({ id: doc.id, ...(doc.data() as Store) });
        });
        setStores(storeList);
      } catch (error) {
        console.error('매장 목록 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [userData]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-bold dark:text-white">매장 관리</h4>
        <div className="flex gap-2">

          <Link
            href="/store/select-category"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + 매장 등록
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">로딩 중...</p>
      ) : stores.length === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">등록된 매장이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {stores.map(store => (
            <li
              key={store.id}
              className="p-4 border rounded dark:border-gray-600 dark:text-white"
            >
              <div className="font-semibold">{store.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-300">
                {store.category} | {store.address}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Link
                  href={`/store/${store.id}`}
                  className="text-gray-700 dark:text-gray-300 text-sm underline hover:text-blue-600"
                >
                  상세 보기
                </Link>
                <Link
                  href={`/store/edit/${store.id}`}
                  className="text-blue-600 text-sm underline hover:text-blue-800"
                >
                  정보 수정
                </Link>
                <Link
                  href={`/store/${store.id}/admin`}
                  className="ml-auto bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded transition"
                >
                  관리하기
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
