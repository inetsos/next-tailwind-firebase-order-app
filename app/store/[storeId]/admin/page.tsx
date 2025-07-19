'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ClipboardDocumentIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

export default function StoreAdminDashboard() {
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;
  const router = useRouter();

  useEffect(() => {
    if (!storeId) {
      alert('잘못된 접근입니다.');
      router.push('/');
    }
  }, [storeId, router]);

  const goToOrderManagement = () => {
    if (storeId) {
      router.push(`/store/${storeId}/orders`);
    }
  };

  const goToMenuManagement = () => {
    if (storeId) {
      router.push(`/store/${storeId}/menus`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">매장 관리자 대시보드</h1>

      <div className="space-y-4">
        <button
          onClick={goToOrderManagement}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-2"
        >
          <ClipboardDocumentIcon className="w-6 h-6" />
          주문 관리
        </button>

        <button
          onClick={goToMenuManagement}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-2"
        >
          <Squares2X2Icon className="w-6 h-6" />
          메뉴 관리
        </button>

        {/* 필요시 추가 버튼 넣기 */}
      </div>
    </div>
  );
}
