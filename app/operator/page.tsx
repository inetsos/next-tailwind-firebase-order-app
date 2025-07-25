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

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-4">
      <h1 className="text-2xl font-bold mb-6">운영자 페이지</h1>

      <button
        onClick={goToStoreCategories}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md w-full"
      >
        매장 분류
      </button>

      <button
        onClick={goToFoodAlleys}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md w-full"
      >
        먹자 골목 등록
      </button>
    </div>
  );
}
