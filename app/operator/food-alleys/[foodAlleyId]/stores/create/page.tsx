'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Store {
  id: string;
  name: string;
  address?: string;
  foodAlleyId?: string;
}

export default function AddStoreToFoodAlleyPage() {
  const router = useRouter();
  const params = useParams();
  const foodAlleyId =
    Array.isArray(params.foodAlleyId) ? params.foodAlleyId[0] : params.foodAlleyId;

  const searchParams = useSearchParams();
  const foodAlleyName = searchParams.get('name');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError('');
    setMessage('');

    if (searchTerm.trim().length < 2) {
      setError('검색어를 두 글자 이상 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, 'stores'),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name'),
        limit(5)
      );

      const snapshot = await getDocs(q);

      const results: Store[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Store[];

      setSearchResults(results);
      if (results.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedStore || !foodAlleyId) return;

    try {
      const storeRef = doc(db, 'stores', selectedStore.id);
      await updateDoc(storeRef, { foodAlleyId });
      setMessage(`매장 "${selectedStore.name}"이 먹자 골목에 등록되었습니다.`);
      setSelectedStore(null);
      setSearchResults([]);
      setSearchTerm('');
    } catch (err) {
      console.error(err);
      setError('매장 등록 중 오류가 발생했습니다.');
    }
  };

  const goToStoreList = () => {
    if (foodAlleyId) {
      router.push(`/operator/food-alleys/${foodAlleyId}/stores`);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{foodAlleyName}에 매장 등록</h1>
        <button
          onClick={goToStoreList}
          className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border rounded-md"
        >
          매장 목록 보기
        </button>
      </div>

      {/* 검색 입력 및 버튼 */}
      <div className="mb-4 flex items-center space-x-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="매장 이름 입력"
          className="flex-1 border px-3 py-2 rounded-md"
        />
        <button
          onClick={handleSearch}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {loading && <p className="text-gray-500">검색 중...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-600 font-medium">{message}</p>}

      {searchResults.map((store) => (
        <div
          key={store.id}
          className={`border p-3 rounded-md mb-2 cursor-pointer ${
            selectedStore?.id === store.id
              ? 'bg-blue-100 border-blue-500'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setSelectedStore(store)}
        >
          <p className="font-semibold">{store.name}</p>
          {store.address && <p className="text-sm text-gray-600">{store.address}</p>}
        </div>
      ))}

      {selectedStore && (
        <div className="mt-6">
          <button
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}
