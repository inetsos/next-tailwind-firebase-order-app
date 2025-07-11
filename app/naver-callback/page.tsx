import { Suspense } from "react";
import NaverCallbackHandler from './NaverCallbackHandler';

export default function NaverCallbackPage() {
  return (
    <Suspense fallback={<div>네이버 로그인 처리 중...</div>}>    
      <NaverCallbackHandler />
    </Suspense>
  );
}