'use client';

import { use, useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Store } from '@/types/store';
import { convertFirestoreTimestamp } from '@/utils/firestoreUtils';
import StoreMap from '@/components/StoreMap';
import StoreList from '@/components/StoreList';

interface PageProps {
  params: Promise<{
    categoryName: string;
  }>;
}

export default function CategoryStorePage({ params }: PageProps) {
  const { categoryName } = use(params);
  const decodedCategoryName = decodeURIComponent(categoryName);
  const [showMap, setShowMap] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // ✅ cleanup을 위한 flag

    const fetchStores = async () => {
      try {
        const q = query(
          collection(db, 'stores'),
          where('category', '==', decodedCategoryName)
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
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStores();

    return () => {
      isMounted = false; // 컴포넌트 언마운트 시 비동기 작업 취소
    };
  }, [decodedCategoryName]);

  return (
    <div className="p-4">
      <h4 className="text-2xl font-bold mb-4">{decodedCategoryName}</h4>

      {loading ? (
        <p>로딩 중...</p>
      ) : stores.length === 0 ? (
        <p>해당 카테고리의 매장이 없습니다.</p>
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
