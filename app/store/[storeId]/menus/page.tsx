'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import MenuList from '@/components/MenuList';
import { useSearchParams } from 'next/navigation';

export default function MenuManagementPage() {
  const params = useParams();
  const storeId = params.storeId;

  const searchParams = useSearchParams();
  const storeName = decodeURIComponent(searchParams.get('name') ?? ''); 

  if (!storeId || typeof storeId !== 'string') return <p>매장 정보 없음</p>;

  return (
    <div className="max-w-5xl mx-auto px-2 py-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-xl sm:text-2xl font-bold">
          {storeName} 메뉴 관리
        </h3>

        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href={`/store/${storeId}/categories/new`}
            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs sm:text-sm text-center"
          >
            카테고리
          </Link>

          <Link
            href={`/store/${storeId}/menus/new`}
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm text-center"
          >
            메뉴 등록
          </Link>

          <Link
            href={`/store/${storeId}/menus/sort`}
            className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs sm:text-sm text-center"
          >
            메뉴 정렬
          </Link>
        </div>
      </div>

      <MenuList storeId={storeId} />
    </div>
  );
}
