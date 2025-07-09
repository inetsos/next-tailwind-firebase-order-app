// components/Navbar.tsx
'use client';

import { useState } from 'react';
import PhoneAuthModal from './PhoneAuthModal';
import { useAuth } from '@/hooks/useAuth';
import { logout } from "@/utils/auth";

export default function Navbar() {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <h1 className="text-lg font-bold">MyApp</h1>

        {user ? (
          <div className="flex gap-4 items-center">
            <span className="text-sm">👤 {user.phoneNumber}</span>
            <button
              onClick={logout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button
            className="bg-blue-500 px-4 py-1 rounded hover:bg-blue-600"
            onClick={() => setShowModal(true)}
          >
            로그인
          </button>
        )}
      </nav>

      <PhoneAuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
