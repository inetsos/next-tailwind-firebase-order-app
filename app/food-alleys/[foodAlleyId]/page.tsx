'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Store } from '@/types/store';
import { useParams, useSearchParams } from 'next/navigation';
import { convertFirestoreTimestamp } from '@/utils/firestoreUtils';
import StoreMap from '@/components/StoreMap';
import StoreList from '@/components/StoreList';

export default function FoodAlleyStoreListPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const foodAlleyId = typeof params.foodAlleyId === 'string' ? params.foodAlleyId : '';
  // 쿼리 파라미터에서 name 받아오기, 없으면 빈 문자열
  const foodAlleyName = searchParams.get('name') ?? '';

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStores = async () => {
      try {
        const q = query(
          collection(db, 'stores'),
          where('foodAlleyId', '==', foodAlleyId)
        );
        const snapshot = await getDocs(q);
        const data: Store[] = snapshot.docs.map(doc =>
          convertFirestoreTimestamp({ id: doc.id, ...(doc.data() as Omit<Store, 'id'>) })
        );
        if (isMounted) {
          setStores(data);
        }
      } catch (err) {
        console.error('매장 불러오기 오류:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (foodAlleyId) {
      fetchStores();
    }

    return () => {
      isMounted = false;
    };
  }, [foodAlleyId]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        {/* 쿼리에서 받은 먹자골목 이름 출력 */}
        <h1 className="text-2xl font-bold">{foodAlleyName || '먹자골목'}</h1>
      </div>

      {loading ? (
        <p>로딩 중...</p>
      ) : stores.length === 0 ? (
        <p>{foodAlleyName} 먹자골목에 등록된 매장이 없습니다.</p>
      ) : (
        <>
          <StoreList stores={stores} />

          <div className="mt-4">
            {showMap && <StoreMap stores={stores} />}
            <button
              onClick={() => setShowMap(prev => !prev)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {showMap ? '지도 닫기' : '지도 보기'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
