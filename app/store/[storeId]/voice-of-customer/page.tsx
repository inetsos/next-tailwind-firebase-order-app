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
import { Message } from '@/types/message';
import { useUserStore } from '@/stores/userStore';

export default function VoiceOfCustomerPage() {
  const { storeId: rawStoreId } = useParams();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [replies, setReplies] = useState<{ [key: string]: Message[] }>({});
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const { userData } = useUserStore();

  const limitCount = 5;

  /** 메시지 + 해당 답변 함께 가져오기 */
  const fetchMessagesWithReplies = async (more = false) => {
    if (!storeId || loading) return;

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

      const newMessages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(prev => more ? [...prev, ...newMessages] : newMessages);
      setLastDoc(snap.docs[snap.docs.length - 1]);

      // 메시지별 답변 불러오기
      const repliesMap: { [key: string]: Message[] } = {};
      for (const msg of newMessages) {
        const replyQuery = query(
          collection(db, 'stores', storeId, 'voiceOfCustomer'),
          where('type', '==', 'reply'),
          where('replyTo', '==', msg.id),
          orderBy('createdAt', 'asc')
        );
        const replySnap = await getDocs(replyQuery);
        repliesMap[msg.id] = replySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      }

      setReplies(prev => ({ ...prev, ...repliesMap }));

      if (snap.docs.length < limitCount) {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  /** 답변 등록 */
  const handleReply = async (messageId: string) => {
    const text = replyText[messageId]?.trim();
    if (!text || !storeId) return;

    await addDoc(collection(db, 'stores', storeId, 'voiceOfCustomer'), {
      type: 'reply',
      message: text,
      storeId,
      userId: userData?.userId, 
      userNumber: userData?.uniqueNumber,  
      replyTo: messageId,
      createdAt: serverTimestamp(),
    });

    setReplyText(prev => ({ ...prev, [messageId]: '' }));
    fetchMessagesWithReplies(); // 새로고침
  };

  useEffect(() => {
    fetchMessagesWithReplies();
  }, [storeId]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold mb-4">고객의 소리</h2>

      <div className="space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="border p-3 rounded space-y-2">
            {/* 메시지 */}
            <p className="font-medium whitespace-pre-line">{msg.message}</p>
            <div className="text-xs text-gray-500">
              {msg.createdAt?.toDate().toLocaleString()} | {msg.userNumber}
            </div>

            {/* 답변 목록 */}
            <ul className="space-y-1 pl-4">
              {(replies[msg.id] || []).map(reply => (
                <li key={reply.id} className="p-2 border rounded bg-gray-50">
                  <p className="whitespace-pre-line">{reply.message}</p>
                  <div className="text-xs text-gray-400">
                    {reply.createdAt?.toDate().toLocaleString()} | {reply.userNumber}
                  </div>
                </li>
              ))}
            </ul>

            {/* 답변 입력 */}
            <div className="relative w-full">
              <textarea
                value={replyText[msg.id] || ''}
                onChange={e => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                placeholder="답변을 입력하세요"
                className="w-full border p-2 rounded pr-20 resize-none"
                rows={2}
              />
              <button
                onClick={() => handleReply(msg.id)}
                className="absolute top-1/2 right-2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded"
              >
                등록
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 더보기 버튼 */}
      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={() => fetchMessagesWithReplies(true)}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            {loading ? '불러오는 중...' : '더보기'}
          </button>
        </div>
      )}
    </div>
  );
}
