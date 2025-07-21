// components/NaverMapLoader.tsx
'use client';

import Script from 'next/script';

interface NaverMapLoaderProps {
  onLoad?: () => void;
}

export default function NaverMapLoader({ onLoad }: NaverMapLoaderProps) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  return (
    <Script
      src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
      onLoad={() => {
        if (onLoad) onLoad();
      }}
      strategy="lazyOnload"
    />
  );
}
