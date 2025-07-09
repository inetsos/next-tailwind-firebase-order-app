// components/Navbar.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PhoneAuthModal from './PhoneAuthModal';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/utils/auth';

export default function Navbar() {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout(() => {
      router.push('/');
    });
  };

  function formatE164ToKorean(e164: string | null | undefined): string {
    if (!e164) return '-';
    if (!e164.startsWith('+82')) return e164; // 한국 번호가 아니면 그대로 반환

    const local = '0' + e164.slice(3); // +82 제거 후 0 추가

    if (local.length === 11) {
      return `${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
    if (local.length === 10) {
      return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
    }

    return local; // 포맷이 맞지 않으면 그냥 반환
  }

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <Link href="/" className="text-lg font-bold">MyApp</Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <Link href="/mypage" className="text-sm hover:underline hover:text-blue-300">
                마이페이지
              </Link>
              <span className="text-sm">👤 {formatE164ToKorean(user.phoneNumber)}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 text-sm"
              >
                로그아웃
              </button>
            </>
          )}
          {!user && (
            <button
              className="bg-blue-500 px-4 py-1 rounded hover:bg-blue-600 text-sm"
              onClick={() => setShowModal(true)}
            >
              로그인
            </button>
          )}
        </div>
      </nav>

      <PhoneAuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
