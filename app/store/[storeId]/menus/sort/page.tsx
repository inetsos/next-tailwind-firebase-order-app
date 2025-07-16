// store/[storeId]/menus/sort/page.tsx
'use client';

import MenuSortList from './MenuSortList'; // 컴포넌트 경로 맞게 수정하세요
import { useParams } from 'next/navigation';

export default function MenuSortPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  if (!storeId) {
    return <p className="text-center mt-10">❌ 매장 ID가 없습니다.</p>;
  }

  return (
    <main className="max-w-xl mx-auto p-4">
      <MenuSortList storeId={storeId} />
    </main>
  );
}
