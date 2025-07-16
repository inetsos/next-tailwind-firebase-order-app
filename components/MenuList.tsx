'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Menu } from '@/types/menu';
import Link from 'next/link';

interface MenuListProps {
  storeId: string;
}

export default function MenuList({ storeId }: MenuListProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'stores', storeId, 'menus'));
        const items: Menu[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Menu[];
        setMenus(items);
      } catch (error) {
        console.error('메뉴 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [storeId]);

  if (loading) return <p>⏳ 메뉴 불러오는 중...</p>;
  if (menus.length === 0) return <p>📭 등록된 메뉴가 없습니다.</p>;

  return (
    <div className="max-w-md mx-auto mt-6 space-y-4 px-4">
      <h2 className="text-xl font-bold">🍽 등록된 메뉴</h2>
      {menus.map((menu) => (
        <div
          key={menu.id}
          className="border rounded p-4 shadow bg-white space-y-3 relative"
        >
          {/* ✏️ 수정 버튼 */}
          <Link
            href={`/store/${storeId}/menus/${menu.id}/edit`}
            className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            ✏️ 수정
          </Link>

          {/* 이미지 */}
          {menu.imageUrl && (
            <img
              src={menu.imageUrl}
              alt={menu.name}
              className="w-full h-auto object-cover rounded border mb-2"
            />
          )}

          {/* 메뉴 정보 */}
          <div>
            <div className="flex justify-between items-center flex-wrap gap-y-1">
              <div className="flex items-baseline gap-2 flex-wrap break-words">
                <h3 className="text-lg font-semibold">{menu.name}</h3>
                <span className="text-sm text-gray-400">({menu.category})</span>
              </div>
              {menu.isSoldOut && (
                <span className="text-sm text-red-600 font-medium">품절</span>
              )}
            </div>

            <p className="text-sm text-gray-500 break-words whitespace-pre-line">
              {menu.description}
            </p>

            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              {menu.prices.map((price, idx) => (
                <li key={idx}>
                  💰 {price.label} - {price.price.toLocaleString()}원
                </li>
              ))}
            </ul>
          </div>

          {/* 필수 옵션 */}
          {menu.requiredOptions?.length > 0 && (
            <div className="text-sm mt-2">
              <strong>⚙️ 필수 옵션</strong>
              <ul className="ml-4 list-disc space-y-1">
                {menu.requiredOptions.map((group, idx) => (
                  <li key={idx}>
                    <strong>{group.name}</strong>
                    <ul className="ml-4 list-circle">
                      {group.options.map((opt, i) => (
                        <li key={i}>
                          {opt.name} - {opt.price.toLocaleString()}원
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 선택 옵션 */}
          {menu.optionalOptions?.length > 0 && (
            <div className="text-sm mt-2">
              <strong>🧩 선택 옵션</strong>
              <ul className="ml-4 list-disc space-y-1">
                {menu.optionalOptions.map((group, idx) => (
                  <li key={idx}>
                    <strong>{group.name}</strong>
                    <ul className="ml-4 list-circle">
                      {group.options.map((opt, i) => (
                        <li key={i}>
                          {opt.name} - {opt.price.toLocaleString()}원
                        </li>
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
  );
}
