'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { Menu } from '@/types/menu';
import Link from "next/link";

interface Category {
  name: string;
  sortOrder: number;
}

export default function SoldOutPage() {
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const fetchData = async () => {
      try {
        const [menuSnapshot, categorySnapshot] = await Promise.all([
          getDocs(collection(db, 'stores', storeId, 'menus')),
          getDocs(collection(db, 'stores', storeId, 'categories')),
        ]);

        const menuList: Menu[] = menuSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Menu[];

        const categoryList: Category[] = categorySnapshot.docs.map((doc) => ({
          name: doc.data().name,
          sortOrder: doc.data().sortOrder || 0,
        }));

        setMenus(menuList);
        setCategories(categoryList.sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (err) {
        console.error('데이터 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  const toggleSoldOut = async (menuId: string, current: boolean) => {
    if (!storeId) return; // storeId가 없으면 실행하지 않음

    try {
      const ref = doc(db, 'stores', storeId, 'menus', menuId);
      await updateDoc(ref, { isSoldOut: !current });

      setMenus((prev) =>
        prev.map((m) => (m.id === menuId ? { ...m, isSoldOut: !current } : m))
      );
    } catch (err) {
      console.error('품절 상태 변경 실패:', err);
    }
  };

  if (loading) {
    return <p className="text-center mt-6 text-gray-500">⏳ 데이터 불러오는 중...</p>;
  }

  if (menus.length === 0) {
    return <p className="text-center mt-6 text-gray-500">📭 등록된 메뉴가 없습니다.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4 flex justify-end">
        <Link href={`/store/${storeId}/admin`}>
          <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700 
                          transition flex items-center gap-1">
            ← 매장 운영 관리
          </span>
        </Link>
      </div>

      <h1 className="text-xl font-bold text-center mt-4 mb-4">❌ 품절 관리</h1>

      {categories.map((category) => {
        const categoryMenus = menus
          .filter((m) => m.category === category.name)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (categoryMenus.length === 0) return null;

        return (
          <div key={category.name} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              📂 {category.name}
            </h2>

            <div className="space-y-4">
              {categoryMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="border rounded p-4 bg-white dark:bg-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    {menu.imageUrl && (
                      <img
                        src={menu.imageUrl}
                        alt={menu.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {menu.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {menu.isSoldOut ? '현재 품절 상태입니다.' : '판매 중입니다.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSoldOut(menu.id, menu.isSoldOut ?? false)}
                    className={`mt-4 sm:mt-0 px-4 py-2 rounded text-sm font-medium text-white transition ${
                      menu.isSoldOut
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {menu.isSoldOut ? '판매' : '품절'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
