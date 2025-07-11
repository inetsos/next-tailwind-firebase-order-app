import { Suspense } from "react";
import KakaoCallbackHandler from './KakaoCallbackHandler';

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={<div>카카오 로그인 처리 중...</div>}>    
      <KakaoCallbackHandler />
    </Suspense>
  );
}