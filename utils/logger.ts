import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

function sanitizeMeta(meta: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in meta) {
    const value = meta[key];

    if (value instanceof Error) {
      result[key] = {
        message: value.message,
        name: value.name,
        stack: value.stack,
      };
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (typeof value === 'function' || typeof value === 'undefined') {
      // Firestore에서 허용하지 않음 → 생략
      continue;
    } else if (typeof value === 'object' && value !== null) {
      try {
        // 순환 참조 방지 + 객체 내부도 직렬화 가능한지 확인
        result[key] = JSON.parse(JSON.stringify(value));
      } catch (e) {
        result[key] = String(value);
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

export async function logEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  meta: Record<string, any> = {}
) {
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'server';

    const logData = {
      level,
      message,
      ...sanitizeMeta(meta), // 안전하게 처리
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
