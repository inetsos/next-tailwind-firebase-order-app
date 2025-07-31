import Link from 'next/link';

export default function MyPagePage() {
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">마이페이지</h1>

      <ul className="space-y-4 text-sm font-bold">
        <li>
          <Link
            href="/mypage/order-messages"
            className="block p-4 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800"
          >
            내 주문 상태 보기
          </Link>
        </li>
        
        <li>
          <Link
            href="/mypage/orders"
            className="block p-4 bg-yellow-100 rounded hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800"
          >
            내 주문 보기
          </Link>
        </li>

        <li>
          <Link
            href="/mypage/profile"
            className="block p-4 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800"
          >
            내 프로필
          </Link>
        </li>
        
      </ul>
    </main>
  );
}
