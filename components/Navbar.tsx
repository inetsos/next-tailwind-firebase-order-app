'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PhoneAuthModal from './PhoneAuthModal';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/utils/auth';
import { useUserStore } from '@/stores/userStore';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user } = useAuth();
  const { userData } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('login') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    await logout(() => router.push('/'));
  };

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);

  const renderMenuItems = () => (
    <>
      <Link href="/store/manage" className="hover:underline hover:text-blue-300 text-sm ml-2">
        매장 관리
      </Link>

      <Link href="/mypage" className="hover:underline hover:text-blue-300 text-sm ml-2">
        마이페이지
      </Link>
      
      <button
        onClick={handleLogout}
        className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600 ml-2"
      >
        로그아웃
      </button>
    </>
  );

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          시지 라이프
        </Link>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-4">
          {/* 👤 사용자 이름 (항상 노출) */}
          {mounted && user && (
            <span className="text-sm text-gray-200">
              👤 {userData?.displayName || '사용자'}
            </span>
          )}

          {/* 데스크탑 메뉴 */}
          {mounted && (
            <div className="hidden sm:flex gap-3 items-center">
              {user ? renderMenuItems() : (
                <button
                  className="bg-blue-500 px-4 py-1 rounded text-sm hover:bg-blue-600"
                  onClick={() => setShowModal(true)}
                >
                  로그인
                </button>
              )}
            </div>
          )}

          {/* 햄버거 메뉴 (모바일용) */}
          {mounted && (
            <button className="sm:hidden" onClick={toggleMobileMenu}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </nav>

      {/* 모바일 메뉴 드로어 */}
      {mounted && mobileMenuOpen && (
        <div className="sm:hidden bg-gray-800 text-white px-4 py-4 space-y-3">
          {user ? renderMenuItems() : (
            <button
              className="bg-blue-500 px-4 py-1 rounded text-sm hover:bg-blue-600"
              onClick={() => {
                setShowModal(true);
                setMobileMenuOpen(false);
              }}
            >
              로그인
            </button>
          )}
        </div>
      )}

      {/* 로그인 모달 */}
      {mounted && (
        <PhoneAuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
