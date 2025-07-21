'use client';

import { useEffect, useState } from 'react';
import { Store } from '@/types/store';
import NaverMapLoader from './NaverMapLoader';

interface StoreMapProps {
  stores: Store[];
}

export default function StoreMap({ stores }: StoreMapProps) {
  const [naverLoaded, setNaverLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.naver && window.naver.maps) {
      setNaverLoaded(true);
    } else {
      const timer = setInterval(() => {
        if (window.naver && window.naver.maps) {
          setNaverLoaded(true);
          clearInterval(timer);
        }
      }, 100);

      return () => clearInterval(timer);
    }
  }, []);

  useEffect(() => {
    if (!naverLoaded) return;
    if (stores.length === 0) return;

    const { naver } = window;

    const avgLat =
      stores.reduce((acc, store) => acc + (Number(store.latitude) || 0), 0) / stores.length;
    const avgLng =
      stores.reduce((acc, store) => acc + (Number(store.longitude) || 0), 0) / stores.length;

    const center = new naver.maps.LatLng(avgLat, avgLng);

    const map = new naver.maps.Map('map', {
      center,
      zoom: 14,
    });

    stores.forEach((store) => {
      const position = new naver.maps.LatLng(Number(store.latitude), Number(store.longitude));

      const marker = new naver.maps.Marker({
        position,
        map,
        title: store.name,
      });

      const infoWindow = new naver.maps.InfoWindow({
        content: '',
        disableAnchor: true,
      });

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
    });
  }, [naverLoaded, stores]);

  return (
    <>
      <NaverMapLoader onLoad={() => setNaverLoaded(true)} />

      <div id="map" className="w-full h-[320px] rounded-lg mb-4" style={{ minHeight: '320px' }} />
    </>
  );
}
