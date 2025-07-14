'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Coords = { lat: number; lng: number };

export default function NaverMapSelectPage() {
  const searchParams = useSearchParams();

  const name = decodeURIComponent(searchParams.get('name') || '');
  const address = decodeURIComponent(searchParams.get('address') || '');
  const latParam = searchParams.get('latitude') || '0';
  const lngParam = searchParams.get('longitude') || '0';

  const [coords, setCoords] = useState<Coords | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    const loadNaverMapScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.naver?.maps) {
          console.log('✅ 네이버 지도 이미 로드됨');
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
        script.async = true;
        console.log('📦 지도 스크립트 추가 시도:', script.src);

        script.onload = () => {
          const checkService = () => {
            if (window.naver?.maps?.Service) {
              resolve();
            } else {
              setTimeout(checkService, 100);
            }
          };
          checkService();
        };

        script.onerror = () => {
          console.error('❌ 스크립트 로딩 실패');
          reject(new Error('네이버 지도 스크립트 로딩 실패'));
        };

        document.head.appendChild(script);
      });
    };

    const geocodeAddress = (addr: string): Promise<Coords> => {
      return new Promise((resolve, reject) => {
        console.log('📡 주소 → 좌표 변환 요청:', addr);
        window.naver.maps.Service.geocode({ address: addr }, (status: string, response: any) => {
          if (status !== window.naver.maps.Service.Status.OK) {
            console.error('❌ 주소 변환 실패:', status);
            reject(new Error('주소 변환 실패'));
            return;
          }

          const result = response.v2.addresses?.[0];
          if (!result) {
            console.warn('⚠️ 주소 결과 없음');
            reject(new Error('주소 결과 없음'));
            return;
          }

          const lat = parseFloat(result.y);
          const lng = parseFloat(result.x);
          console.log('✅ 주소 변환 성공:', { lat, lng });
          resolve({ lat, lng });
        });
      });
    };

    const init = async () => {
      try {
        console.log('🛠️ 지도 초기화 시작');
        await loadNaverMapScript();

        let lat = parseFloat(latParam);
        let lng = parseFloat(lngParam);

        console.log('🔢 초기 파라미터:', { lat, lng });

        if (!lat || !lng || (lat === 0 && lng === 0)) {
          console.log('🔄 좌표 정보 없음. 주소로 변환 시도');
          const result = await geocodeAddress(address);
          lat = result.lat;
          lng = result.lng;
        }

        console.log('📍 최종 좌표 설정:', { lat, lng });
        setCoords({ lat, lng });
        setSelectedCoords({ lat, lng }); // 초기 선택 좌표도 세팅
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`지도 초기화 실패: ${msg}`);
      }
    };

    init();
  }, [address, latParam, lngParam]);

  useEffect(() => {
    if (!coords || !window.naver?.maps) return;

    const { lat, lng } = coords;
    console.log('🗺️ 지도 렌더링 시작:', { lat, lng });

    const map = new window.naver.maps.Map('map', {
      center: new window.naver.maps.LatLng(lat, lng),
      zoom: 16,
    });

    const marker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(lat, lng),
      map,
      title: name,
    });

    const isDarkMode = document.documentElement.classList.contains('dark'); // tailwind dark mode 감지

    const infoWindow = new window.naver.maps.InfoWindow({
      content: `
        <div style="
          padding:10px;
          background-color: ${isDarkMode ? '#1f2937' : '#ffffff'};  /* dark:bg-gray-800 / bg-white */
          color: ${isDarkMode ? '#e5e7eb' : '#111827'};              /* dark:text-gray-200 / text-gray-900 */
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.4;
        ">
          <strong>${name}</strong><br/>${address}
        </div>
      `,
    });

    // const infoWindow = new window.naver.maps.InfoWindow({
    //   content: `<div style="padding:10px;"><b>${name}</b><br/>${address}</div>`,
    // });

    infoWindow.open(map, marker);

    map.addListener('click', (e: any) => {
      const clickedLat = e.coord.lat();
      const clickedLng = e.coord.lng();
      console.log('🖱️ 지도 클릭 위치:', { clickedLat, clickedLng });

      marker.setPosition(new window.naver.maps.LatLng(clickedLat, clickedLng));
      setSelectedCoords({ lat: clickedLat, lng: clickedLng });
    });
  }, [coords, name, address]);

  const handleSetLocationClick = () => {
    if (!selectedCoords) {
      alert('위치를 먼저 선택하세요.');
      return;
    }
    const confirmed = window.confirm(
      `선택한 위치가 맞습니까?\n위도: ${selectedCoords.lat.toFixed(
        6
      )}\n경도: ${selectedCoords.lng.toFixed(6)}`
    );
    if (confirmed) {
      window.opener?.postMessage(
        {
          type: 'coords',
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
        },
        window.location.origin
      );
      window.close();
    }
  };

  const handleCancelClick = () => {
    window.close();
  };

  return (
    <div className="p-2 flex flex-col h-full">
      <div className="flex items-center justify-between mb-1 -mt-6">
        <h3 className="text-lg font-semibold">{name} 위치 선택</h3>
        <p className="text-sm ml-4">지도를 클릭하여 위치를 선택하세요.</p>
      </div>
      <div id="map" style={{ width: '100%', height: '400px', flexGrow: 1 }} />

      <div className="mt-2 flex gap-2">
        <button
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded"
          onClick={handleSetLocationClick}
        >
          위치 설정
        </button>
        <button
          className="flex-1 bg-gray-300 hover:bg-gray-400 py-2 rounded"
          onClick={handleCancelClick}
        >
          취소
        </button>
      </div>
    </div>
  );
}
