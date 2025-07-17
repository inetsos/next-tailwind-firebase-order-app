// utils/setupGlobalErrorHandler.ts
import { logEvent } from '@/utils/logger'

export function setupGlobalErrorHandler() {
  if (typeof window === 'undefined') return;

  window.onerror = (msg, src, line, col, err) => {
    logEvent('error', 'JS 전역 에러', {
      message: msg,
      source: src,
      line,
      col,
      stack: err?.stack,
    });
  };

  window.onunhandledrejection = (event) => {
    logEvent('error', 'Unhandled Promise rejection', {
      reason: event.reason,
    });
  };
}
