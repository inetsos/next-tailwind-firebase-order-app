// app/operator/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function OperatorPage() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/operator/store-categories');
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">운영자 페이지</h1>
      <button
        onClick={handleClick}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
      >
        매장 분류
      </button>
    </div>
  );
}
