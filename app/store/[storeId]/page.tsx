'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Store, HolidayRule, DayOfWeek } from '@/types/store';
import Link from 'next/link';
import { useUserStore } from '@/stores/userStore';
import { PencilSquareIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

declare global {
  interface Window {
    naver: any;
  }
}

export default function StoreLandingPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllBusinessHours, setShowAllBusinessHours] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const { userData } = useUserStore();

  const loadNaverMapScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.naver?.maps) return resolve();
      const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
      const script = document.createElement('script');
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('네이버 지도 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    if (!storeId) return router.push('/');
    const fetchStore = async () => {
      const docRef = doc(db, 'stores', storeId);
      const snap = await getDoc(docRef);
      if (snap.exists()) setStore({ id: snap.id, ...snap.data() } as Store);
      else router.push('/');
      setLoading(false);
    };
    fetchStore();
  }, [storeId]);

  useEffect(() => {
    if (!store || !mapRef.current) return;
    const initMap = async () => {
      await loadNaverMapScript();
      const { latitude, longitude, name, address } = store;
      const position = new window.naver.maps.LatLng(+latitude, +longitude);
      const map = new window.naver.maps.Map(mapRef.current, { center: position, zoom: 15 });
      const marker = new window.naver.maps.Marker({ position, map, title: name });
      const isDark = document.documentElement.classList.contains('dark');
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="
            padding:10px;
            background-color: ${isDark ? '#1f2937' : '#ffffff'};
            color: ${isDark ? '#e5e7eb' : '#111827'};
            border-radius: 8px;
            font-size: 10px;">
            <strong>${name}</strong><br/>${address}
          </div>`,
      });
      infoWindow.open(map, marker);
    };
    initMap();
  }, [store]);

  if (loading || !store) return <p className="p-6 text-center">로딩 중...</p>;

  const getWeekNumberOfMonth = (date: Date): number => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const offset = first.getDay();
    return Math.ceil((date.getDate() + offset) / 7);
  };

  const renderTodayBusinessHour = () => {
    const days: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];
    const today = new Date();
    const label = days[today.getDay()];
    const hour = store.businessHours?.[label];
    const rule = store.holidayRule;
    const isHoliday =
      rule?.days.includes(label) &&
      (rule.frequency === '매주' || (rule.frequency === '매월' && rule.weeks?.includes(getWeekNumberOfMonth(today))));
    if (!hour?.opening || !hour.closing || isHoliday)
      return <p className="text-sm text-red-500">{label}요일: 오늘은 휴무입니다.</p>;

    const now = new Date();
    const open = new Date(now); const close = new Date(now);
    const [h1, m1] = hour.opening.split(':').map(Number);
    const [h2, m2] = hour.closing.split(':').map(Number);
    open.setHours(h1, m1); close.setHours(h2, m2);
    const isOpen = now >= open && now < close;

    return (
      <>
        <p className="text-sm">{label}요일: {hour.opening} ~ {hour.closing}</p>
        <p className={`text-sm font-semibold ${isOpen ? 'text-green-600' : 'text-red-500'}`}>
          {isOpen ? '영업 중입니다' : '영업 중이 아닙니다.'}
        </p>
      </>
    );
  };

  const renderAllBusinessHours = () => {
    const days: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];
    return (
      <div className="mt-2 text-sm">
        {days.map((day) => {
          const h = store.businessHours?.[day];
          return (
            <div key={day} className={(!h?.opening || !h?.closing) ? 'text-red-500' : ''}>
              {day}: {h?.opening && h?.closing ? `${h.opening} ~ ${h.closing}` : '휴무'}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md rounded-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{store.name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{store.category}</p>
        </div>

        {userData?.userId === store.admin && (
          <div className="flex gap-2">
            <Link href={`/store/edit/${store.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1">
              <PencilSquareIcon className="w-4 h-4" />
              정보 수정
            </Link>
            <Link href={`/store/${store.id}/menus`} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1">
              <Squares2X2Icon className="w-4 h-4" />
              메뉴 관리
            </Link>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">
        {store.description}
      </p>

      {/* 영업시간 */}
      <div className="flex items-start mb-2">
        <div className="w-24 text-sm shrink-0 font-semibold text-gray-900 dark:text-white">영업시간</div>
        <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">
          {renderTodayBusinessHour()}
          <button
            onClick={() => setShowAllBusinessHours((prev) => !prev)}
            className="mt-0 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAllBusinessHours ? '영업시간 숨기기' : '영업시간 보기'}
          </button>
          {showAllBusinessHours && renderAllBusinessHours()}
        </div>
      </div>

      {/* 휴무일 */}
      <div className="flex items-start mb-2">
        <div className="w-24 text-sm shrink-0 font-semibold text-gray-900 dark:text-white">휴무일</div>
        <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">
          {store.holidayRule?.days?.join(', ') || '없음'}
          {store.holidayRule?.weeks?.length ? ` (매월 ${store.holidayRule.weeks.join(', ')}주차)` : ''}
        </div>
      </div>

      {/* 주소 */}
      <div className="flex items-start mb-2">
        <div className="w-24 text-sm shrink-0 font-semibold text-gray-900 dark:text-white">주소</div>
        <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">
          {store.address} {store.detailAddress}
        </div>
      </div>

      <div ref={mapRef} className="h-64 border rounded-md shadow-md dark:border-gray-600" />
    </main>
  );
}
