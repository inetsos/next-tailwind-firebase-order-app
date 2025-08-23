'use client';

import { useRouter } from 'next/navigation';

export default function OperatorPage() {
  const router = useRouter();

  const goToStoreCategories = () => {
    router.push('/operator/store-categories');
  };

  const goToFoodAlleys = () => {
    router.push('/operator/food-alleys');
  };

  const goToUserManagement = () => {
    router.push('/operator/users');
  };

  const goToLogs = () => {
    router.push('/operator/logs');
  };

  return (
    <div className="max-w-xl mx-auto py-4 px-4 space-y-4">
      <h1 className="text-2xl font-bold mb-6">운영자 페이지</h1>

      <button
        onClick={goToStoreCategories}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md w-full"
      >
        매장 분류 관리
      </button>

      <button
        onClick={goToFoodAlleys}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md w-full"
      >
        먹자 골목 관리
      </button>

      <button
        onClick={goToUserManagement}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md w-full"
      >
        회원 관리
      </button>

      <button
        onClick={goToLogs}
        className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-md w-full"
      >
        로그 보기
      </button>
    </div>
  );
}
