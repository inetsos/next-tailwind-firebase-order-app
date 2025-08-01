import Link from 'next/link';
import MyProfile from '@/components/MyProfile';

export default function MyProfilePage() {
  return (
    <main className="max-w-3xl mx-auto p-2 space-y-6">
      <div className="text-end">
        <Link
          href="/mypage"
          className="text-blue-600 hover:underline font-medium"
        >
          ← 마이페이지로
        </Link>
      </div>
      <MyProfile />
    </main>
  );
}
