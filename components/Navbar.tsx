'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PhoneAuthModal from './PhoneAuthModal';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/utils/auth';
import { useUserStore } from '@/stores/userStore';

export default function Navbar() {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false); 
  
  const { user } = useAuth();
  const { userData } = useUserStore(); 
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true); // ✅ 클라이언트에서만 렌더
    if (searchParams.get('login') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    await logout(() => {
      router.push('/');
    });
  };

  const formatE164ToKorean = (e164: string | null | undefined): string => {
    if (!e164) return '-';
    if (!e164.startsWith('+82')) return e164;
    const local = '0' + e164.slice(3);
    if (local.length === 11) return `${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    if (local.length === 10) return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
    return local;
  };

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <Link href="/" className="text-lg font-bold">
          시지 라이프
        </Link>

        {mounted && (
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/store/register" className="text-sm hover:underline hover:text-blue-300">
                  매장 등록
                </Link>
                <Link href="/mypage" className="text-sm hover:underline hover:text-blue-300">
                  마이페이지
                </Link>
                {/* ✅ 사용자 이름 출력 */}
                <span className="text-sm">
                  👤 {userData?.displayName || '사용자'}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 text-sm"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                className="bg-blue-500 px-4 py-1 rounded hover:bg-blue-600 text-sm"
                onClick={() => setShowModal(true)}
              >
                로그인
              </button>
            )}
          </div>
        )}
      </nav>

      {mounted && (
        <PhoneAuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
