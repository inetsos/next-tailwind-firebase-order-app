'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import dayjs from 'dayjs';

interface VoiceMessage {
  id: string;
  type: 'message' | 'reply';
  message: string;
  userId: string;
  userNumber?: string;
  replyTo?: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

export default function CustomerChatPage() {
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const { userData } = useUserStore();
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [replies, setReplies] = useState<{ [key: string]: VoiceMessage[] }>({});
  const [message, setMessage] = useState('');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);

  const limitCount = 3;
  const effectRan = useRef(false);

  /** 메시지 + 주인장 답변 불러오기 */
  const fetchMessagesWithReplies = async (more = false) => {
    if (!storeId || !userData?.userId || loading) return;

    setLoading(true);
    try {
      let q;
      if (more && lastDoc) {
        q = query(
          collection(db, 'stores', storeId, 'voiceOfCustomer'),
          where('type', '==', 'message'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(limitCount)
        );
      } else {
        q = query(
          collection(db, 'stores', storeId, 'voiceOfCustomer'),
          where('type', '==', 'message'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snap = await getDocs(q);
      if (snap.empty) {
        setHasMore(false);
        return;
      }

      const newMessages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VoiceMessage));
      setMessages(prev => more ? [...prev, ...newMessages] : newMessages);
      setLastDoc(snap.docs[snap.docs.length - 1]);

      // 메시지별 주인장 답변 불러오기
      const repliesMap: { [key: string]: VoiceMessage[] } = {};
      for (const msg of newMessages) {
        const replyQuery = query(
          collection(db, 'stores', storeId, 'voiceOfCustomer'),
          where('type', '==', 'reply'),
          where('replyTo', '==', msg.id),
          orderBy('createdAt', 'asc')
        );
        const replySnap = await getDocs(replyQuery);
        repliesMap[msg.id] = replySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VoiceMessage));
      }

      setReplies(prev => ({ ...prev, ...repliesMap }));
      if (snap.docs.length < limitCount) setHasMore(false);

    } finally {
      setLoading(false);
    }
  };

  /** 고객 메시지 전송 */
  const handleSend = async () => {
    if (!storeId || !userData?.userId || !message.trim()) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'stores', storeId, 'voiceOfCustomer'), {
        type: 'message',
        message,
        storeId,
        userId: userData.userId,
        userNumber: userData.uniqueNumber,
        createdAt: serverTimestamp(),
      });

      setMessage('');
      setMessages([]);
      setReplies({});
      setLastDoc(null);
      setHasMore(true);
      fetchMessagesWithReplies();
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!storeId || !userData?.userId) return;
    if (effectRan.current) return;
    effectRan.current = true;

    setMessages([]);
    setReplies({});
    setLastDoc(null);
    setHasMore(true);
    fetchMessagesWithReplies();
  }, [storeId, userData?.userId]);

  const formatDate = (timestamp?: { seconds: number; nanoseconds: number }) =>
    timestamp ? dayjs(timestamp.seconds * 1000).format('YYYY.MM.DD HH:mm') : '';

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-4">문의 내역</h2>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className="space-y-1 border p-3 rounded">
            {/* 고객 메시지 */}
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 self-start">
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                나 | {formatDate(msg.createdAt)}
              </div>
              <div className="whitespace-pre-line">{msg.message}</div>
            </div>

            {/* 주인장 답변 */}
            {(replies[msg.id] || []).map(reply => (
              <div key={reply.id} className="p-2 rounded-lg bg-green-100 dark:bg-green-900 self-end ml-auto text-right">
                <div className="text-xs text-gray-400 mb-1">
                  주인장 | {formatDate(reply.createdAt)}
                </div>
                <div className="whitespace-pre-line">{reply.message}</div>
              </div>
            ))}
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-gray-500 text-center">메시지가 없습니다.</p>
        )}

        {hasMore && (
          <div className="text-center mt-4">
            <button
              onClick={() => fetchMessagesWithReplies(true)}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {loading ? '불러오는 중...' : '더보기'}
            </button>
          </div>
        )}
      </div>

      {/* 메시지 작성 */}
      <div className="mt-4 flex gap-2">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={2}
          className="flex-1 border p-2 rounded resize-none"
          placeholder="메시지를 입력하세요..."
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {sending ? '전송 중...' : '보내기'}
        </button>
      </div>
    </div>
  );
}
