'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Store, HolidayRule, DayOfWeek } from '@/types/store';

declare global {
  interface Window {
    naver: any;
  }
}

export default function StoreLandingPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement | null>(null);

  // 지도 스크립트 로드
  const loadNaverMapScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.naver?.maps) {
        resolve();
        return;
      }

      const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
      const script = document.createElement('script');
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('네이버 지도 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  };

  // 매장 정보 가져오기
  useEffect(() => {
    if (!storeId) {
      alert('잘못된 접근입니다.');
      router.push('/');
      return;
    }

    async function fetchStore() {
      try {
        const docRef = doc(db, 'stores', storeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStore({ id: docSnap.id, ...docSnap.data() } as Store);
        } else {
          alert('등록된 매장을 찾을 수 없습니다.');
          router.push('/');
        }
      } catch (err) {
        console.error(err);
        alert('매장 정보를 불러오는 중 오류가 발생했습니다.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    fetchStore();
  }, [storeId, router]);

  // 지도 렌더링
  useEffect(() => {
    if (!store || !mapRef.current) return;

    const initMap = async () => {
      await loadNaverMapScript();

      const { latitude, longitude, name, address } = store;
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const position = new window.naver.maps.LatLng(lat, lng);

      const map = new window.naver.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
      });

      const marker = new window.naver.maps.Marker({
        position,
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
    };

    initMap();
  }, [store]);

  if (loading) return <p className="p-6 text-center">로딩 중...</p>;
  if (!store) return null;

  // 오늘이 매월 몇 주차인지 계산
  const getWeekNumberOfMonth = (date: Date): number => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const offset = first.getDay();
    const adjustedDate = date.getDate() + offset;
    return Math.ceil(adjustedDate / 7);
  };

  // 오늘 영업시간 표시
  const renderTodayBusinessHour = () => {
    if (!store.businessHours) return <p>영업시간 정보가 없습니다.</p>;

    const today = new Date();
    const dayIndex = today.getDay();
    const days: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];
    const todayLabel = days[dayIndex];
    const todayHour = store.businessHours[todayLabel];

    const rule: HolidayRule | undefined = store.holidayRule;
    const isTodayHoliday =
      rule?.days?.includes(todayLabel) &&
      (rule.frequency === '매주' ||
        (rule.frequency === '매월' &&
          rule.weeks?.includes(getWeekNumberOfMonth(today))));

    if (!todayHour || !todayHour.opening || !todayHour.closing || isTodayHoliday) {
      return (
        <div>
          <p className="text-sm">
            <strong>{todayLabel}요일</strong>: 오늘은 휴무입니다.
          </p>
          <p className="text-sm font-semibold mt-1 text-red-500">영업 중이 아닙니다.</p>
        </div>
      );
    }

    const now = new Date();
    const [openHour, openMin] = todayHour.opening.split(':').map(Number);
    const [closeHour, closeMin] = todayHour.closing.split(':').map(Number);

    const openTime = new Date(now);
    openTime.setHours(openHour, openMin, 0, 0);
    const closeTime = new Date(now);
    closeTime.setHours(closeHour, closeMin, 0, 0);

    const isOpenNow = now >= openTime && now < closeTime;

    return (
      <div>
        <p className="text-sm">
          {todayLabel}요일: {todayHour.opening} ~ {todayHour.closing}
        </p>
        <p className={`text-sm font-semibold mt-1 ${isOpenNow ? 'text-green-600' : 'text-red-500'}`}>
          {isOpenNow ? '영업 중입니다' : '영업 중이 아닙니다.'}
        </p>
      </div>
    );
  };

  const renderHolidayRule = () => {
    const rule = store.holidayRule;
    if (!rule || !rule.days || rule.days.length === 0) return <p className="text-sm">휴무일이 없습니다.</p>;

    return (
      <p className="text-sm">
        {rule.frequency} 휴무: {rule.days.join(', ')}
        {rule.weeks && rule.weeks.length > 0 && <> (매월 {rule.weeks.join(', ')}주차)</>}
      </p>
    );
  };

  return (
    <main className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="flex items-baseline mb-2 -mt-4">
        <h4 className="text-xl font-bold">{store.name}</h4>
        <p className="text-gray-600 dark:text-gray-300 text-base ml-4">{store.category}</p>
      </div>

      <p className="mb-6 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
        {store.description}
      </p>

      <section className="space-y-4">
        {/* 영업시간 */}
        <div className="flex">
          <div className="w-24 shrink-0 font-semibold text-base text-gray-900 dark:text-white">영업시간</div>
          <div className="text-sm">{renderTodayBusinessHour()}</div>
        </div>

        {/* 휴무일 */}
        <div className="flex">
          <div className="w-24 shrink-0 font-semibold text-base text-gray-900 dark:text-white">휴무일</div>
          <div className="text-sm">{renderHolidayRule()}</div>
        </div>

        {/* 주소 */}
        <div className="flex">
          <div className="w-24 shrink-0 font-semibold text-base text-gray-900 dark:text-white">주소</div>
          <div className="flex-1">
            <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">
              {store.address} {store.detailAddress ?? ''}
            </p>
          </div>
        </div>

        {/* 지도 */}
        <div
          ref={mapRef}
          className="h-64 w-full border rounded overflow-hidden border-gray-300 dark:border-gray-600"
        />
      </section>
    </main>
  );
}
