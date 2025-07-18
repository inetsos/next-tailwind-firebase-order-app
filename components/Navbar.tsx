'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import PhoneAuthModal from './PhoneAuthModal';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/utils/auth';
import { useUserStore } from '@/stores/userStore';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/types/cart';

export default function Navbar() {
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user } = useAuth();
  const { userData } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { carts } = useCart();

  // 현재 URL에서 storeId 추출 (예: /store/abc123/menu → abc123)
  const storeId = useMemo(() => {
    const match = pathname?.match(/^\/store\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const items: CartItem[] = useMemo(() => {
    if (!storeId) return [];
    return carts[storeId] ?? [];
  }, [carts, storeId]);

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('login') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    await logout(() => router.push('/'));
  };

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  const totalCount = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

  const renderMenuItems = () => (
    <>
      <Link
        href="/store/manage"
        className="hover:underline hover:text-blue-300 text-sm ml-2"
        onClick={() => setMobileMenuOpen(false)}
      >
        매장 관리
      </Link>
      <Link
        href="/mypage"
        className="hover:underline hover:text-blue-300 text-sm ml-2"
        onClick={() => setMobileMenuOpen(false)}
      >
        마이페이지
      </Link>
      <button
        onClick={() => {
          handleLogout();
          setMobileMenuOpen(false);
        }}
        className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600 ml-2"
      >
        로그아웃
      </button>
    </>
  );

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white px-4 py-3 flex items-center justify-between shadow-md"
        role="navigation"
        aria-label="주요 네비게이션"
      >
        <Link href="/" className="text-lg font-bold" onClick={() => setMobileMenuOpen(false)}>
          시지 라이프
        </Link>

        <div className="flex items-center gap-4">
          {mounted && user && (
            <span className="text-sm text-gray-200 select-none" aria-label="사용자 이름">
              👤 {userData?.displayName || '사용자'}
            </span>
          )}

          {/* 장바구니 아이콘 */}
          {mounted && storeId && (
            <Link
              href={`/store/${storeId}/cart`}
              className="relative focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              aria-label={`장바구니 열기, 아이템 수 ${totalCount}개`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingCart size={24} className="text-gray-200 hover:text-blue-400" />
              {totalCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 bg-red-600 rounded-full text-xs w-5 h-5 flex items-center justify-center font-semibold"
                  aria-live="polite"
                >
                  {totalCount}
                </span>
              )}
            </Link>
          )}

          {/* 데스크탑 메뉴 */}
          {mounted && (
            <div className="hidden sm:flex gap-3 items-center select-none">
              {user ? renderMenuItems() : (
                <button
                  className="bg-blue-500 px-4 py-1 rounded text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => setShowModal(true)}
                  aria-haspopup="dialog"
                  aria-expanded={showModal}
                >
                  로그인
                </button>
              )}
            </div>
          )}

          {/* 모바일 메뉴 토글 버튼 */}
          {mounted && (
            <button
              className="sm:hidden focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </nav>

      {/* 모바일 드로어 */}
      {mounted && mobileMenuOpen && (
        <div
          className="sm:hidden bg-gray-800 text-white px-4 py-4 space-y-3 fixed top-[56px] left-0 right-0 z-40"
          role="menu"
          aria-label="모바일 메뉴"
        >
          {user ? renderMenuItems() : (
            <button
              className="bg-blue-500 px-4 py-1 rounded text-sm hover:bg-blue-600 w-full"
              onClick={() => {
                setShowModal(true);
                setMobileMenuOpen(false);
              }}
              aria-haspopup="dialog"
              aria-expanded={showModal}
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

      {/* 네비게이션 높이만큼 padding-top 추가 (고정 네비게이션과 겹치지 않게) */}
      <style jsx global>{`
        body {
          padding-top: 56px; /* nav 높이만큼 */
        }
        @media (min-width: 640px) {
          body {
            padding-top: 48px; /* sm 이상일 때 높이 조절 필요 시 */
          }
        }
      `}</style>
    </>
  );
}
