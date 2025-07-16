'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import MenuList from '@/components/MenuList';

export default function MenuManagementPage() {
  const params = useParams();
  const storeId = params.storeId;

  if (!storeId || typeof storeId !== 'string') return <p>매장 정보 없음</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">메뉴 관리</h3>

        <div className="flex gap-2">
          <Link
            href={`/store/${storeId}/categories/new`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            카테고리
          </Link>
          
          <Link
            href={`/store/${storeId}/menus/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            메뉴 등록
          </Link>
        </div>
      </div>

      <MenuList storeId={storeId} />
    </div>
  );
}
