import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export async function logEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  meta: Record<string, any> = {}
) {
  try {
    // 클라이언트 환경인지 확인 (Next.js SSR 대비)
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'server';

    const logData = {
      level,
      message,
      ...meta,
      userAgent,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, 'logs'), logData);

    if (process.env.NODE_ENV !== 'production') {
      console[level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}] ${message}`, meta);
    }
  } catch (err) {
    console.error('로그 기록 실패:', err);
  }
}
