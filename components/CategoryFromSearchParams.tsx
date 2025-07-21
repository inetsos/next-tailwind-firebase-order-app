'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Store } from '@/types/store';

interface Props {
  onSetCategory: (category: string) => void;
}

export default function CategoryFromSearchParams({ onSetCategory }: Props) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const categoryId = searchParams.get('categoryId');
    if (!categoryId) return;

    const fetchCategoryName = async () => {
      try {
        const docRef = doc(db, 'store-categories', categoryId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          onSetCategory(data.name); // 부모로 카테고리 전달
        }
      } catch (error) {
        console.error('카테고리 조회 오류:', error);
      }
    };

    fetchCategoryName();
  }, [searchParams, onSetCategory]);

  return null;
}
