'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';

interface Store {
  id: string;
  name: string;
  address: string;
  // 필요 시 필드 추가
}

export default function FoodAlleyStoresPage() {
  const params = useParams();
  const router = useRouter();

  // foodAlleyId가 string인지 체크해서 안전하게 사용
  const foodAlleyId =
    Array.isArray(params.foodAlleyId) ? params.foodAlleyId[0] : params.foodAlleyId;

  const [foodAlleyName, setFoodAlleyName] = useState('');
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    if (!foodAlleyId) return;

    // 먹자 골목 이름 가져오기
    const fetchFoodAlleyName = async () => {
      const foodAlleyRef = doc(db, 'foodAlleys', foodAlleyId);
      const docSnap = await getDoc(foodAlleyRef);
      if (docSnap.exists()) {
        setFoodAlleyName(docSnap.data().name || '');
      }
    };

    fetchFoodAlleyName();
  }, [foodAlleyId]);

  useEffect(() => {
    if (!foodAlleyId) return;

    // 먹자 골목에 속한 매장 리스트 실시간 구독
    const q = query(
      collection(db, 'stores'),
      where('foodAlleyId', '==', foodAlleyId),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Store, 'id'>),
      }));
      setStores(list);
    });

    return () => unsubscribe();
  }, [foodAlleyId]);

  if (!foodAlleyId) return <p>잘못된 경로입니다.</p>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">[{foodAlleyName}] 먹자 골목 매장 목록</h1>

      <button
        onClick={() =>
          router.push(
            `/operator/food-alleys/${foodAlleyId}/stores/create?name=${encodeURIComponent(foodAlleyName)}`
          )
        }
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
      >
        + 매장 등록
      </button>


      <ul className="space-y-4">
        {stores.map((store) => (
          <li
            key={store.id}
            className="border border-gray-300 p-4 rounded-md flex justify-between items-center"
          >
            <div>
              <h2 className="text-lg font-semibold">{store.name}</h2>
              <p className="text-sm text-gray-600">{store.address}</p>
            </div>
            {/* 필요시 편집, 삭제 버튼 추가 */}
          </li>
        ))}
        {stores.length === 0 && <p className="text-gray-500">등록된 매장이 없습니다.</p>}
      </ul>
    </div>
  );
}
