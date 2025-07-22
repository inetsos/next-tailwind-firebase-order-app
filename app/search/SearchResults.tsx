'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  getDocs,
  query, 
  where,
} from 'firebase/firestore';
import { Store } from '@/types/store';
import { convertFirestoreTimestamp } from '@/utils/firestoreUtils';
import { Search } from 'lucide-react';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const keyword = searchParams.get('query') ?? '';
  const [inputValue, setInputValue] = useState(keyword);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(keyword);
  }, [keyword]);

  useEffect(() => {
    if (!keyword.trim()) {
      setStores([]);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        // Firestore에서 name_keywords 배열에 포함된 키워드로 필터링
        const q = query(
          collection(db, 'stores'),
          where('name_keywords', 'array-contains', keyword.toLowerCase())
        );
        const snapshot = await getDocs(q);
        const matched = snapshot.docs.map(doc =>
          convertFirestoreTimestamp({ id: doc.id, ...(doc.data() as Omit<Store, 'id'>) })
        );
        setStores(matched);
      } catch (error) {
        console.error('검색 중 오류 발생:', error);
        setStores([]);
      }
      setLoading(false);
    })();
  }, [keyword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    router.push(`/search?query=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-gray-900 dark:text-white">
      {/* 검색 입력폼 */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="매장명을 검색하세요"
          className="flex-1 border p-2 rounded"
          autoFocus
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>

      <h1 className="text-2xl font-bold mb-6">
        🔍 검색 결과: <span className="text-blue-600">"{keyword}"</span>
      </h1>

      {loading && <p className="p-6 text-center">로딩 중...</p>}
      {!loading && stores.length === 0 && <p className="text-gray-500">검색 결과가 없습니다.</p>}

      <ul className="grid gap-4">
        {stores.map(store => (
          <li key={store.id}>
            <Link
              href={`/store/${store.id}`}
              className="block p-4 border rounded-lg shadow-sm bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              <h2 className="text-lg font-semibold">{store.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {store.description || '설명이 없습니다.'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
