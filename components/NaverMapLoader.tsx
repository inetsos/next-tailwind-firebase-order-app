'use client';

import Script from 'next/script';

export default function NaverMapLoader() {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  return (    
    <Script
      strategy="afterInteractive"
      src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
    />
  );
}
