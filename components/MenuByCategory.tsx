'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Menu } from '@/types/menu';
import Link from 'next/link';

interface MenuByCategoryProps {
  storeId: string;
}

interface CategoryInfo {
  name: string;
  sortOrder: number;
}

export default function MenuByCategory({ storeId }: MenuByCategoryProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuSnapshot, categorySnapshot] = await Promise.all([
          getDocs(collection(db, 'stores', storeId, 'menus')),
          getDocs(collection(db, 'stores', storeId, 'categories')),
        ]);

        const menuItems: Menu[] = menuSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Menu[];

        const categoryList: CategoryInfo[] = categorySnapshot.docs.map((doc) => ({
          name: doc.data().name,
          sortOrder: doc.data().sortOrder || 0,
        }));

        setMenus(menuItems);
        setCategories(categoryList.sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  const handleCategoryClick = (categoryName: string) => {
    const target = categoryRefs.current[categoryName];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) return <p className="text-center text-sm">⏳ 메뉴 불러오는 중...</p>;
  if (menus.length === 0) return <p className="text-center text-sm">📭 등록된 메뉴가 없습니다.</p>;

  return (
    <div className="space-y-6">
      {/* 카테고리 버튼 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((category) => (
          <button
            key={category.name}
            className="px-3 py-1 rounded-full border border-gray-400 text-sm 
                       hover:bg-gray-200 dark:hover:bg-gray-700 
                       dark:border-gray-600 dark:text-white"
            onClick={() => handleCategoryClick(category.name)}
            type="button"
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 메뉴 리스트 */}
      {categories.map((category) => {
        const categoryMenus = menus
          .filter((menu) => menu.category === category.name)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (categoryMenus.length === 0) return null;

        return (
          <div
            key={category.name}
            ref={(el) => {
              categoryRefs.current[category.name] = el;
            }}
          >
            <h3 className="text-base font-bold text-gray-700 dark:text-white mb-2">
              📂 {category.name}
            </h3>

            <div className="space-y-4">
              {categoryMenus.map((menu) => (
                <Link
                  key={menu.id}
                  href={`/store/${storeId}/menus/${menu.id}/order`}
                  className="block border border-gray-200 dark:border-gray-700 rounded p-3 
                             shadow-sm bg-white dark:bg-gray-900 
                             text-gray-900 dark:text-gray-100 
                             hover:shadow-md transition-shadow"
                >
                  {menu.imageUrl && (
                    <img
                      src={menu.imageUrl}
                      alt={menu.name}
                      className="w-full aspect-video object-cover rounded border border-gray-300 dark:border-gray-700"
                    />
                  )}

                  <div className="flex justify-between items-center flex-wrap gap-y-1">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      {menu.name}
                    </h4>
                    {menu.isSoldOut && (
                      <span className="text-xs text-red-600 font-medium">품절</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 break-words whitespace-pre-line">
                    {menu.description}
                  </p>

                  <ul className="text-sm text-gray-800 dark:text-gray-200 mt-2 space-y-1">
                    {menu.prices && menu.prices.length > 0 ? (
                      menu.prices.map((price, idx) => (
                        <li key={idx}>
                          💰 {price.label} - {price.price.toLocaleString()}원
                        </li>
                      ))
                    ) : menu.price !== undefined ? (
                      <li>
                        💰 {menu.price.toLocaleString()}원
                      </li>
                    ) : null}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}