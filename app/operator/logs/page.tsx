'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

interface LogItem {
  id: string;
  level: string;
  category?: string;
  message: string;
  storeId: string;
  timestamp?: { seconds: number; nanoseconds: number };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // 날짜별 로그 불러오기
  useEffect(() => {
    const fetchLogs = async () => {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      end.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'logs'),
        where('timestamp', '>=', Timestamp.fromDate(start)),
        where('timestamp', '<', Timestamp.fromDate(end)),
        orderBy('timestamp', 'desc')
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LogItem[];

      setLogs(data);

      // 카테고리 목록 추출 (undefined 제외)
      const uniqueCategories = Array.from(
        new Set(data.map((log) => log.category).filter((cat): cat is string => Boolean(cat)))
      );
      setCategories(uniqueCategories);
    };

    fetchLogs(); // <- 호출 누락 부분 수정
  }, [selectedDate]);

  const changeDate = (days: number) => {
    setSelectedDate((prev: Date) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  // 카테고리 필터링된 로그
  const filteredLogs =
    selectedCategory === '전체'
      ? logs
      : logs.filter((log) => log.category === selectedCategory);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">로그 보기</h1>

      {/* 날짜 선택 컨트롤 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => changeDate(-1)}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          이전날
        </button>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            setSelectedDate(newDate);
          }}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={() => changeDate(1)}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          다음날
        </button>
      </div>

      {/* 카테고리 선택 */}
      <div className="mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="전체">전체</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 로그 목록 */}
      {filteredLogs.length === 0 ? (
        <div className="text-gray-500">이 날짜에는 로그가 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {filteredLogs.map((log) => (
            <li key={log.id} className="p-3 border rounded">
              <div className="font-semibold">
                [{log.level.toUpperCase()}] {log.message}
              </div>
              {log.category && (
                <div className="text-xs text-gray-500">카테고리: {log.category}</div>
              )}
              <div className="text-sm text-gray-600">
                {log.timestamp
                  ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                  : '시간 없음'}
              </div>
              <div className="text-xs text-gray-500">{log.storeId}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
