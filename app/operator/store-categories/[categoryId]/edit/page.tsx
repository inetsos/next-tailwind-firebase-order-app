'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function EditStoreCategoryPage() {
  const router = useRouter();
  const params = useParams();

  // params.id 타입 좁히기 (string인지 체크)
  const categoryId = params?.id;
  if (!categoryId || Array.isArray(categoryId)) {
    // 잘못된 id면 리다이렉트 후 아무것도 렌더링하지 않음
    router.push('/operator/store-categories');
    return null;
  }

  const [name, setName] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryInput, setIndustryInput] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'store-categories', categoryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setIndustries(data.industries || []);
          setSortOrder(data.sortOrder ?? 0);
        } else {
          alert('해당 분류를 찾을 수 없습니다.');
          router.push('/operator/store-categories');
        }
      } catch (error) {
        console.error('분류 불러오기 실패:', error);
        alert('분류 불러오기 중 오류가 발생했습니다.');
        router.push('/operator/store-categories');
      }
      setLoading(false);
    };

    fetchCategory();
  }, [categoryId, router]);

  const handleAddIndustry = () => {
    if (industryInput.trim() && !industries.includes(industryInput.trim())) {
      setIndustries([...industries, industryInput.trim()]);
      setIndustryInput('');
    }
  };

  const handleRemoveIndustry = (item: string) => {
    setIndustries(industries.filter(i => i !== item));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('분류 이름을 입력하세요');
      return;
    }

    try {
      const docRef = doc(db, 'store-categories', categoryId);
      await updateDoc(docRef, {
        name,
        industries,
        sortOrder,
        updatedAt: new Date(),
      });
      router.push('/operator/store-categories');
    } catch (error) {
      console.error('분류 업데이트 실패:', error);
      alert('분류 수정 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <p className="p-6 text-center">로딩 중...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">매장 분류 수정</h1>

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
            <span
              key={i}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm cursor-pointer"
              onClick={() => handleRemoveIndustry(item)}
              title="클릭하여 삭제"
            >
              {item} ×
            </span>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit}>저장</Button>
    </div>
  );
}
