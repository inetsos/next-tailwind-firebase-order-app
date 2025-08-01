'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { UserData } from '@/types/UserData';
import Link from 'next/link';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const userList = snapshot.docs.map(doc => ({
          ...(doc.data() as UserData),
          userId: doc.id,
        }));
        setUsers(userList);
      } catch (err) {
        console.error('회원 정보 가져오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <Link
          href="/operator"
          className="text-sm text-blue-600 hover:underline"
        >
          ← 운영자 페이지로
        </Link>
      </div>

      {loading ? (
        <p>로딩 중...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">등록된 회원이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {users.map((user) => (
            <li
              key={user.userId}
              className="border p-4 rounded-md shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center"
            >
              <div>
                <p className="font-semibold text-lg">
                  {user.displayName || '(이름 없음)'}
                </p>
                <p className="text-gray-600 text-sm">{user.phoneNumber}</p>
                <p className="text-sm text-gray-400">역할: {user.role}</p>
              </div>
              {/* 향후 편집, 삭제 등 기능 추가 가능 */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
