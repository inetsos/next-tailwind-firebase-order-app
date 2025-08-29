'use client';

import { useStoreStore } from '@/stores/useStoreStore';
import { useInitializeStore } from '@/hooks/useInitializeStore'; // 경로 맞게 수정
import {
  ClipboardDocumentIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  BellIcon,
  MegaphoneIcon,
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

  const cardItems = [
    {
      title: '주문 관리',
      description: '고객의 주문 목록을 확인하고 처리할 수 있어요.',
      icon: <ClipboardDocumentIcon className="w-8 h-8 text-blue-600" />,
      bg: 'bg-blue-50',
      onClick: () => router.push(`/store/${storeId}/orders`),
    },
    {
      title: '메뉴 관리',
      description: '판매 중인 메뉴를 등록하거나 수정할 수 있어요.',
      icon: <Squares2X2Icon className="w-8 h-8 text-green-600" />,
      bg: 'bg-green-50',
      onClick: () => router.push(`/store/${storeId}/menus`),
    },
    {
      title: '품절 관리',
      description: '품절된 메뉴를 설정하거나 해제할 수 있어요.',
      icon: <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />,
      bg: 'bg-yellow-50',
      onClick: () => router.push(`/store/${storeId}/sold-out`),
    },
    {
      title: 'QR 코드 생성',
      description: '내 가게의 URL 주소 QR 코드를 생성할 수 있어요.',
      icon: <QrCodeIcon className="w-8 h-8 text-gray-700" />,
      bg: 'bg-gray-100',
      onClick: () => router.push(`/store/${storeId}/qr`),
    },
    {
      title: '고객 알림 등록',
      description: '고객에게 알림 메시지를 전송할 수 있어요.',
      icon: <BellIcon className="w-8 h-8 text-pink-600" />,
      bg: 'bg-pink-50',
      onClick: () => router.push(`/store/${storeId}/notifications`),
    },
    {
      title: '고객의 소리',
      description: '고객이 남긴 의견과 피드백을 확인할 수 있어요.',
      icon: <MegaphoneIcon className="w-8 h-8 text-purple-600" />,
      bg: 'bg-purple-50',
      onClick: () => router.push(`/store/${storeId}/voice-of-customer`),
    },

  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center">
        {store.name} 운영 관리
      </h1>

      <div className="grid grid-cols-1 gap-4">
        {cardItems.map((item, index) => (
          <div
            key={index}
            onClick={item.onClick}
            className={`cursor-pointer ${item.bg} p-4 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 hover:border-gray-300`}
          >
            <div className="flex items-center gap-4">
              {item.icon}
              <div>
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
