'use client';

import { useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewStoreCategoryPage() {
  const [name, setName] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const router = useRouter();

  const handleAddIndustry = () => {
    if (industryInput.trim()) {
      setIndustries([...industries, industryInput.trim()]);
      setIndustryInput('');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return alert('분류 이름을 입력하세요');

    await addDoc(collection(db, 'store-categories'), {
      name,
      industries,
      sortOrder,
      createdAt: serverTimestamp(),
    });

    router.push('/operator/store-categories');
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">새 매장 분류 등록</h1>
        <Link
          href="/operator/store-categories"
          className="text-blue-600 underline text-sm"
        >
          목록으로
        </Link>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">분류 이름</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">정렬 순서</label>
        <Input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          placeholder="숫자가 낮을수록 먼저 표시"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">업종 추가</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
            placeholder="예: 치킨, 피자"
          />
          <Button onClick={handleAddIndustry}>추가</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {industries.map((item, i) => (
            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {item}
            </span>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit}>저장</Button>
    </div>
  );
}
