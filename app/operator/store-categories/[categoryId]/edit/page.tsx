'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function EditStoreCategoryPage() {
  const router = useRouter();
  const params = useParams();

  const rawId = (params as any)?.categoryId;
  const categoryId = useMemo(() => {
    if (Array.isArray(rawId)) return rawId[0];
    return typeof rawId === 'string' ? rawId : '';
  }, [rawId]);

  const [name, setName] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryInput, setIndustryInput] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setInvalid(true);
      router.replace('/operator/store-categories');
    }
  }, [categoryId, router]);

  useEffect(() => {
    if (!categoryId) return;

    let cancelled = false;

    const fetchCategory = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'store-categories', categoryId);
        const docSnap = await getDoc(docRef);

        if (!cancelled) {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setName((data.name as string) || '');
            setIndustries((data.industries as string[]) || []);
            setSortOrder((data.sortOrder as number) ?? 0);
          } else {
            alert('해당 분류를 찾을 수 없습니다.');
            router.replace('/operator/store-categories');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('분류 불러오기 실패:', error);
        if (!cancelled) {
          alert('분류 불러오기 중 오류가 발생했습니다.');
          router.replace('/operator/store-categories');
          setLoading(false);
        }
      }
    };

    fetchCategory();
    return () => {
      cancelled = true;
    };
  }, [categoryId, router]);

  const handleAddIndustry = () => {
    const v = industryInput.trim();
    if (v && !industries.includes(v)) {
      setIndustries(prev => [...prev, v]);
    }
    setIndustryInput('');
  };

  const handleRemoveIndustry = (item: string) => {
    setIndustries(prev => prev.filter(i => i !== item));
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

  if (invalid) return null;
  if (loading) return <p className="p-6 text-center">로딩 중...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* 🔙 리스트로 돌아가기 링크 */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xl font-bold">매장 분류 수정</h4>
        <Link
          href="/operator/store-categories"
          className="text-sm text-blue-600 hover:underline"
        >
          ← 분류 목록
        </Link>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">분류 이름</label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">정렬 순서</label>
        <Input
          type="number"
          value={sortOrder}
          onChange={e => setSortOrder(Number(e.target.value) || 0)}
          placeholder="숫자가 낮을수록 먼저 표시"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">업종 추가</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={industryInput}
            onChange={e => setIndustryInput(e.target.value)}
            placeholder="예: 치킨, 피자"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddIndustry();
              }
            }}
          />
          <Button type="button" onClick={handleAddIndustry}>
            추가
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {industries.map(item => (
            <span
              key={item}
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
