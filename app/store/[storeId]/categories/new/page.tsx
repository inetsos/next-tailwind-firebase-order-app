'use client';

import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import CategoryManager, { CategoryManagerRef } from '@/components/CategoryManager';

export default function NewCategoryPage() {
  const { storeId } = useParams() as { storeId: string };
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const router = useRouter();

  const categoryRef = useRef<CategoryManagerRef>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('카테고리 이름을 입력하세요.');
      return;
    }

    try {
      await addDoc(collection(db, 'stores', storeId, 'categories'), {
        name: name.trim(),
        sortOrder,
        createdAt: new Date(),
      });

      alert('카테고리가 등록되었습니다.');
      setName('');
      setSortOrder(0);

      categoryRef.current?.fetchCategories();
    } catch (error) {
      console.error('카테고리 등록 실패:', error);
      alert('등록 실패');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 shadow rounded text-sm text-gray-900 dark:text-gray-100">
      <div className="text-right -mt-2">
        <button
          onClick={() => router.push(`/store/${storeId}/menus`)}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          ← 메뉴 관리
        </button>
      </div>

      <h3 className="text-xl font-bold mb-4">📂 카테고리 관리</h3>

      <CategoryManager ref={categoryRef} storeId={storeId} />

      <div className="mt-6">
        <label className="block mb-1 font-medium">카테고리 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white p-2 rounded mb-4"
        />

        <label className="block mb-1 font-medium">정렬 순서</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          onFocus={(e) => e.target.select()}
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white p-2 rounded mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-2 rounded"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
