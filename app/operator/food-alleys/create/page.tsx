'use client';

import { useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FoodAlleyCreatePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('이름을 입력하세요.');
      return;
    }

    await addDoc(collection(db, 'foodAlleys'), {
      name: name.trim(),
      description: description.trim(),
      sortOrder: Number(sortOrder),
      createdAt: serverTimestamp(),
    });

    alert('먹자 골목이 등록되었습니다.');
    router.push('/operator/food-alleys');
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xl font-bold">먹자 골목 등록</h4>
        <Link
          href="/operator/food-alleys"
          className="text-sm text-blue-600 hover:text-black hover:underline"
        >
          ← 목록으로
        </Link>
      </div>


      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">설명</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">정렬 순서 (숫자)</label>
          <input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md"
          >
            등록하기
          </button>

        </div>
      </form>
    </div>
  );
}
