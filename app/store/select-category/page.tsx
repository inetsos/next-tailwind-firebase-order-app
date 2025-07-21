'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

interface StoreCategory {
  id: string;
  name: string;
}

export default function SelectCategoryPage() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      const q = query(collection(db, 'store-categories'), orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        const { id: _id, ...rest } = data;
        return { id: doc.id, ...rest } as StoreCategory;
      });
      setCategories(list);
    };

    fetchCategories();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">분류 선택</h1>
      <ul className="space-y-3">
        {categories.map((cat) => (
          <li
            key={cat.id}
            onClick={() => router.push(`/store/register?categoryId=${cat.id}`)}
            className="p-4 border rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
          >
            {cat.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
