import Link from "next/link";
import { Package, ClipboardList, User, MessageCircle } from "lucide-react";

export default function MyPagePage() {
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">마이페이지</h1>

      <ul className="space-y-4 text-sm font-bold">
        <li>
          <Link
            href="/mypage/order-messages"
            className="flex items-center gap-3 p-4 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800"
          >
            <Package className="w-5 h-5" />
            <span>내 주문 상태 보기</span>
          </Link>
        </li>

        <li>
          <Link
            href="/mypage/orders"
            className="flex items-center gap-3 p-4 bg-yellow-100 rounded hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800"
          >
            <ClipboardList className="w-5 h-5" />
            <span>내 주문 보기</span>
          </Link>
        </li>

        <li>
          <Link
            href="/mypage/profile"
            className="flex items-center gap-3 p-4 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800"
          >
            <User className="w-5 h-5" />
            <span>내 프로필</span>
          </Link>
        </li>

        {/* 새로 추가된 버튼 */}
        <li>
          <Link
            href="/mypage/messages"
            className="flex items-center gap-3 p-4 bg-purple-100 rounded hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800"
          >
            <MessageCircle className="w-5 h-5" />
            <span>주인장에게 보낸 메시지</span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
