// app/naver-map-view/page.tsx
import React, { Suspense } from 'react';
import NaverMapViewClient from './NaverMapViewClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <NaverMapViewClient />
    </Suspense>
  );
}
