'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { addNotification } from '@/utils/notifications';

export default function NewNotificationPage() {
  const { storeId } = useParams();
  const router = useRouter();

  const [message, setMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || !startDate || !endDate || typeof storeId !== 'string') {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (sDate > eDate) {
      alert('시작일은 종료일보다 앞서야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await addNotification(storeId, message, sDate, eDate);
      router.push(`/store/${storeId}/notifications`);
    } catch (error) {
      console.error('알림 저장 실패:', error);
      alert('알림 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">고객 알림 등록</h2>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="알림 내용을 입력하세요"
        className="w-full h-32 p-2 border rounded text-sm mb-3"
      />

      <div className="flex gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-sm mb-1">공지 시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 rounded text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">공지 종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 rounded text-sm"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow text-sm disabled:opacity-50"
      >
        {loading ? '등록 중...' : '등록하기'}
      </button>
    </div>
  );
}
