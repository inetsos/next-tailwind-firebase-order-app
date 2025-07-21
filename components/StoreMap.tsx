'use client';

import { useEffect } from 'react';
import { Store } from '@/types/store';
import NaverMapLoader from './NaverMapLoader';

interface StoreMapProps {
  stores: Store[];
}

export default function StoreMap({ stores }: StoreMapProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || stores.length === 0) return;

    const initMap = async () => {
      const { naver } = window;

      if (!naver || !naver.maps) return;

      // ✅ 지도 중심 좌표 (첫 매장 또는 기본)
      const center = new naver.maps.LatLng(
        stores[0].latitude || 37.5665,
        stores[0].longitude || 126.9780
      );

      // ✅ 지도 생성
      const map = new naver.maps.Map('map', {
        center,
        zoom: 13,
      });

      // ✅ 마커 + InfoWindow(상호명) 생성
      stores.forEach((store) => {
        const position = new naver.maps.LatLng(store.latitude, store.longitude);

        // 마커 생성
        const marker = new naver.maps.Marker({
          position,
          map,
          title: store.name
        });

        const infoWindow = new naver.maps.InfoWindow({
        content: '',
        disableAnchor: true,
      });
      
        // 상호명 정보창 생성 및 항상 표시
        // ✅ 마커 클릭 시 InfoWindow 열기
        naver.maps.Event.addListener(marker, 'click', () => {
          infoWindow.setContent(`
            <div style="
              padding: 6px 10px;
              font-size: 13px;
              background: #ffffff;
              border: 1px solid #ccc;
              border-radius: 6px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              white-space: nowrap;
              user-select: none;
            ">
              ${store.name}
            </div>
          `);
          infoWindow.open(map, marker);
        });

        //infoWindow.open(map, marker); // 항상 표시
      });
    };

    initMap();
  }, [stores]);

  return (
    <>
      <NaverMapLoader />
      <div id="map" className="w-full h-[400px] rounded-lg mb-4" />
    </>
  );
}