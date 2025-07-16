// /app/store/[id]/menus/new/page.tsx - 메뉴 등록
'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import MenuForm from '@/components/MenuForm';

export default function NewMenuPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  useEffect(() => {
    //console.log('📦 storeId:', storeId);
  }, [storeId]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <MenuForm storeId={storeId} />
    </div>
  );
}
