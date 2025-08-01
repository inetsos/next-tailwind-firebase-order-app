'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export default function StoreInfoViewPage() {
  const { storeId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<{
    name: string;
    owner: string;
    address: string;
    registrationNumber: string;
    originInfo: string;
  } | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!storeId) return;

      const docRef = doc(db, 'stores', String(storeId), 'info', 'basic');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setInfo(docSnap.data() as typeof info);
      }

      setLoading(false);
    };

    fetchInfo();
  }, [storeId]);

  const handleBack = () => {
    if (storeId) {
      router.push(`/store/${storeId}`);
    }
  };

  if (loading) return <div className="text-center py-8">불러오는 중...</div>;
  if (!info) return <div className="text-center py-8">가게 정보가 없습니다.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-2 space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleBack}
          className="text-blue-600 hover:underline text-sm"
        >
          ← 돌아가기
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4">가게 정보 조회</h2>

      <InfoItem label="상호명" value={info.name} />
      <InfoItem label="대표자명" value={info.owner} />
      <InfoItem label="사업장 주소" value={info.address} />
      <InfoItem label="사업자등록번호" value={info.registrationNumber} />
      <hr className="my-6" />
      <InfoItem label="원산지 표기" value={info.originInfo} multiline />
    </div>
  );
}

function InfoItem({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-1">{label}</div>
      {multiline ? (
        <div className="whitespace-pre-wrap border p-3 rounded bg-gray-50">{value}</div>
      ) : (
        <div className="border p-3 rounded bg-gray-50">{value}</div>
      )}
    </div>
  );
}
