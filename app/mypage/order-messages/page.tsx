import Link from 'next/link';
import MyOrderMessages from '@/components/MyOrderMessages';

export default function MyOrderMessagesPage() {
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      
      <div className="text-end">
        <Link
          href="/mypage"
          className="text-blue-600 hover:underline font-medium"
        >
          ← 마이페이지로
        </Link>
      </div>
      <MyOrderMessages />
    </main>
  );
}
