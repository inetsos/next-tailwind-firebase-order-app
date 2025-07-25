'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Menu } from '@/types/menu';
import Link from 'next/link';

interface MenuListProps {
  storeId: string;
}

interface CategoryInfo {
  name: string;
  sortOrder: number;
}

export default function MenuList({ storeId }: MenuListProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return <p className="text-center text-sm text-gray-600 dark:text-gray-300">⏳ 메뉴 불러오는 중...</p>;
  if (menus.length === 0)
    return <p className="text-center text-sm text-gray-600 dark:text-gray-300">📭 등록된 메뉴가 없습니다.</p>;

  return (
    <div className="mt-4 space-y-6 px-2">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🍽 카테고리별 메뉴</h2>

      {categories.map((category) => {
        const categoryMenus = menus
          .filter((menu) => menu.category === category.name)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (categoryMenus.length === 0) return null;

        return (
          <div key={category.name}>
            <h3 className="text-base font-bold text-gray-700 dark:text-white mb-2">📂 {category.name}</h3>

            <div className="space-y-4">
              {categoryMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="border border-gray-200 dark:border-gray-700 rounded p-3 shadow-sm bg-white dark:bg-gray-800 space-y-3 relative"
                >
                  <Link
                    href={`/store/${storeId}/menus/${menu.id}/edit`}
                    className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600"
                  >
                    ✏️ 수정
                  </Link>

                  {menu.imageUrl && (
                    <img
                      src={menu.imageUrl}
                      alt={menu.name}
                      className="w-full aspect-video object-cover rounded border dark:border-gray-700"
                    />
                  )}

                  <div>
                    <div className="flex justify-between items-center flex-wrap gap-y-1">
                      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{menu.name}</h3>
                      {menu.isSoldOut && <span className="text-xs text-red-600 font-medium">품절</span>}
                    </div>

                    {menu.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 break-words whitespace-pre-line">
                        {menu.description}
                      </p>
                    )}

                    {/* ✅ 가격 정보 출력 */}
                    <ul className="text-sm text-gray-800 dark:text-gray-200 mt-2 space-y-1">
                      {Array.isArray(menu.prices) && menu.prices.length > 0 ? (
                        menu.prices.map((price, idx) => (
                          <li key={idx}>💰 {price.label} - {price.price.toLocaleString()}원</li>
                        ))
                      ) : menu.price !== undefined ? (
                        <li>💰 가격 - {menu.price.toLocaleString()}원</li>
                      ) : (
                        <li>💸 가격 정보 없음</li>
                      )}
                    </ul>
                  </div>

                  {/* ✅ 필수 옵션 */}
                  {menu.requiredOptions?.length > 0 && (
                    <div className="text-sm mt-2 text-gray-800 dark:text-gray-200">
                      <strong>⚙️ 필수 옵션</strong>
                      <ul className="ml-4 list-disc space-y-1">
                        {menu.requiredOptions.map((group, idx) => (
                          <li key={idx}>
                            <strong>{group.name}</strong>
                            <ul className="ml-4 list-circle">
                              {group.options.map((opt, i) => (
                                <li key={i}>{opt.name} - {opt.price.toLocaleString()}원</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ✅ 선택 옵션 */}
                  {menu.optionalOptions?.length > 0 && (
                    <div className="text-sm mt-2 text-gray-800 dark:text-gray-200">
                      <strong>🧩 선택 옵션</strong>
                      <ul className="ml-4 list-disc space-y-1">
                        {menu.optionalOptions.map((group, idx) => (
                          <li key={idx}>
                            <strong>{group.name}</strong>
                            <ul className="ml-4 list-circle">
                              {group.options.map((opt, i) => (
                                <li key={i}>{opt.name} - {opt.price.toLocaleString()}원</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
