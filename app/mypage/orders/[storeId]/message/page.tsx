'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  collection,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  startAfter,
  addDoc,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import dayjs from 'dayjs';
import { useRef } from 'react';

interface VoiceMessage {
  id: string;
  type: 'message' | 'reply';
  message: string;
  storeName: string;
  userId: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

export default function StoreChatPage() {
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const { user } = useAuth();
  const { userData } = useUserStore();

  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const todayStart = dayjs().startOf('day').toDate(); // 오늘 00:00

  // 메시지 불러오기
  const fetchMessages = async (more = false) => {
    if (!storeId || !userData?.userId) return;

    const limitCount = 3;
    setLoading(true);

    try {
      let q;

      if (more && lastDoc) {
        // 더보기: 날짜 제한 없이 이어서 가져오기
        q = query(
          collection(db, 'stores', storeId, 'voiceOfCustomer'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(limitCount)
        );
      } else {
        // 처음: 오늘 날짜 이후 메시지만 가져오기
        q = query(
          collection(db, 'stores', storeId, 'voiceOfCustomer'),
          where('createdAt', '>=', todayStart),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const newMessages = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<VoiceMessage, 'id'>;
        return { ...data, id: doc.id };
      });

      setMessages((prev) => [...prev, ...newMessages]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      if (snapshot.docs.length < limitCount) {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // 메시지 전송
  const handleSend = async () => {
    if (!storeId) return;
    if (!user?.uid || !userData?.userId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!message.trim()) {
      alert('메시지를 입력해주세요.');
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, 'stores', storeId, 'voiceOfCustomer'), {
        type: 'message',
        storeId,
        storeName: '', // 필요하면 쿼리스트링이나 별도 state에서 가져오기
        userId: userData?.userId,
        userNumber: userData.uniqueNumber,
        message,
        createdAt: serverTimestamp(),
      });

      setMessage('');
      setMessages([]); // 새로 불러오기 위해 초기화
      setLastDoc(null);
      setHasMore(true);
      fetchMessages();
    } catch (error) {
      console.error(error);
      alert('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!storeId || !userData?.userId) return;

    // 이미 실행했으면 return
    if (effectRan.current) return;
    effectRan.current = true;

    setMessages([]);
    setLastDoc(null);
    setHasMore(true);
    fetchMessages();
  }, [storeId, userData?.userId]);

  const formatDate = (timestamp?: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return '';
    return dayjs(timestamp.seconds * 1000).format('YYYY.MM.DD HH:mm');
  };

  const effectRan = useRef(false);

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        대화 내역
      </h2>

      {/* 메시지 목록 */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-[100%] ${
              msg.type === 'message'
                ? 'bg-blue-100 dark:bg-blue-900 self-start text-left ml-0'
                : 'bg-green-100 dark:bg-green-900 self-end text-right ml-auto'
            }`}
          >
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1 flex justify-between">
              <span>{msg.type === 'message' ? '나' : '주인장'}</span>
              <span>{formatDate(msg.createdAt)}</span>
            </div>
            <div className="whitespace-pre-line">
              {msg.message}
            </div>            
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-gray-500 text-center">메시지가 없습니다.</p>
        )}

        {hasMore && (
          <div className="text-center mt-6">
            <button
              onClick={() => fetchMessages(true)}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {loading ? '불러오는 중...' : '더보기'}
            </button>
          </div>
        )}
      </div>

      {/* 메시지 입력 */}
      <div className="mt-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded-lg p-3 mb-2 dark:bg-gray-800 dark:text-white"
          rows={3}
          placeholder="메시지를 입력하세요..."
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
        >
          {sending ? '전송 중...' : '보내기'}
        </button>
      </div>
    </div>
  );
}
