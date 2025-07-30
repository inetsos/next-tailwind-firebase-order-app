'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  ClipboardDocumentIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

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
    if (storeId) router.push(`/store/${storeId}/orders`);
  };

  const goToMenuManagement = () => {
    if (storeId) router.push(`/store/${storeId}/menus`);
  };

  const goToSoldOutManagement = () => {
    if (storeId) router.push(`/store/${storeId}/sold-out`);
  };

  const goToQrCodePage = () => {
    if (storeId) router.push(`/store/${storeId}/qr`);
  };

  const goToNotificationPage = () => {
    if (storeId) router.push(`/store/${storeId}/notifications`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center">매장 운영 관리</h1>

      <div className="space-y-4">
        <button
          onClick={goToOrderManagement}
          className="w-full py-2 px-6 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl 
                  flex items-center justify-center gap-3 shadow-sm transition"
        >
          <ClipboardDocumentIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          주문 관리
        </button>

        <button
          onClick={goToMenuManagement}
          className="w-full py-2 px-6 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white rounded-xl 
                  flex items-center justify-center gap-3 shadow-sm transition"
        >
          <Squares2X2Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          메뉴 관리
        </button>

        <button
          onClick={goToSoldOutManagement}
          className="w-full py-2 px-6 text-sm sm:text-base bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl 
                  flex items-center justify-center gap-3 shadow-sm transition"
        >
          <ExclamationTriangleIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          품절 관리
        </button>

        <button
          onClick={goToQrCodePage}
          className="w-full py-2 px-6 text-sm sm:text-base bg-gray-700 hover:bg-gray-800 text-white rounded-xl 
                  flex items-center justify-center gap-3 shadow-sm transition"
        >
          <QrCodeIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          QR 코드 생성
        </button>

        <button
          onClick={goToNotificationPage}
          className="w-full py-2 px-6 text-sm sm:text-base bg-pink-600 hover:bg-pink-700 text-white rounded-xl 
                  flex items-center justify-center gap-3 shadow-sm transition"
        >
          <BellIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          고객 알림 등록
        </button>
      </div>
    </div>
  );
}
