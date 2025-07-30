'use client';

import { useStoreStore } from '@/stores/useStoreStore';
import { useInitializeStore } from '@/hooks/useInitializeStore'; // 경로 맞게 수정
import {
  ClipboardDocumentIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useParams, useRouter } from 'next/navigation';

export default function StoreAdminDashboard() {
  const router = useRouter();
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const { store } = useStoreStore();

  // 매장 데이터 불러오는 커스텀 훅 사용
  useInitializeStore();

  if (!store) {
    return <p className="p-6 text-center">로딩 중...</p>;
  }

  const goToOrderManagement = () => router.push(`/store/${storeId}/orders`);
  const goToMenuManagement = () => router.push(`/store/${storeId}/menus`);
  const goToSoldOutManagement = () => router.push(`/store/${storeId}/sold-out`);
  const goToQrCodePage = () => router.push(`/store/${storeId}/qr`);
  const goToNotificationPage = () => router.push(`/store/${storeId}/notifications`);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center">
        {store.name} 운영 관리
      </h1>

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
