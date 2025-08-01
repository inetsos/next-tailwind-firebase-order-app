'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/firebase/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

export default function StoreInfoPage() {
  const { storeId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    owner: '',
    address: '',
    registrationNumber: '',
    originInfo: '',
  });

  useEffect(() => {
    const fetchInfo = async () => {
      if (!storeId) return;

      const docRef = doc(db, 'stores', String(storeId), 'info', 'basic');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setForm(docSnap.data() as typeof form);
      }

      setLoading(false);
    };

    fetchInfo();
  }, [storeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!storeId) return;

    const docRef = doc(db, 'stores', String(storeId), 'info', 'basic');
    await setDoc(docRef, form, { merge: true });
    alert('저장되었습니다.');
    router.push(`/store/manage`);
  };

  const handleCancel = () => {
    router.push(`/store/manage`);
  };

  if (loading) {
    return <div className="text-center py-8">불러오는 중...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">가게 정보</h2>

      <label className="block">
        <span className="text-sm font-medium">상호명</span>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="mt-1 block w-full border px-3 py-2 rounded"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">대표자명</span>
        <input
          type="text"
          name="owner"
          value={form.owner}
          onChange={handleChange}
          className="mt-1 block w-full border px-3 py-2 rounded"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">사업장 주소</span>
        <input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          className="mt-1 block w-full border px-3 py-2 rounded"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">사업자등록번호</span>
        <input
          type="text"
          name="registrationNumber"
          value={form.registrationNumber}
          onChange={handleChange}
          className="mt-1 block w-full border px-3 py-2 rounded"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">원산지 표기</span>
        <textarea
          name="originInfo"
          value={form.originInfo}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full border px-3 py-2 rounded"
        />
      </label>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          저장
        </button>
        <button
          onClick={handleCancel}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded"
        >
          취소
        </button>
      </div>
    </div>
  );
}
