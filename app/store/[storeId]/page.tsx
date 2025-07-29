'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Store, HolidayRule, DayOfWeek } from '@/types/store';
import Link from 'next/link';
import { useUserStore } from '@/stores/userStore';
import { PencilSquareIcon, Squares2X2Icon, ArrowUpIcon } from '@heroicons/react/24/outline';
import MenuByCategory from '@/components/MenuByCategory';

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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { userData } = useUserStore();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
  }, [storeId, router]);

  useEffect(() => {
    if (!store) return;
    const scrolledFromOrder = sessionStorage.getItem('scrollToMenu') === 'true';
    if (scrolledFromOrder) {
      setTimeout(() => {
        if (menuRef.current) {
          const navbarHeight = 56;
          const menuTop = menuRef.current.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: menuTop - navbarHeight, behavior: 'smooth' });
          sessionStorage.removeItem('scrollToMenu');
        }
      }, 100);
    }
  }, [store]);

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
          <div id="infoWindowContent" style="padding:10px; background-color: ${isDark ? '#1f2937' : '#ffffff'}; 
                      color: ${isDark ? '#e5e7eb' : '#111827'}; border-radius: 8px; font-size: 10px; cursor: pointer;">
            <strong>${name}</strong><br/>${address}
          </div>`,
        clickable: true, 
      });

      //infoWindow.open(map, marker);

      // ✅ 마커 클릭 시 InfoWindow 열기
      window.naver.maps.Event.addListener(marker, 'click', () => {
        infoWindow.open(map, marker);
      });

      //infoWindow 클릭하면 닫힘.
      const observer = new MutationObserver(() => {
        const el = document.getElementById('infoWindowContent');
        if (el) {
          el.addEventListener('click', () => {
            infoWindow.close();
          });

          observer.disconnect(); // 더 이상 감지 필요 없음
        }
      });

      // body 또는 infoWindow가 렌더링되는 container에서 감지
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

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
    const open = new Date(now);
    const close = new Date(now);
    const [h1, m1] = hour.opening.split(':').map(Number);
    const [h2, m2] = hour.closing.split(':').map(Number);
    open.setHours(h1, m1);
    close.setHours(h2, m2);
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
          const isHoliday = !h?.opening || !h?.closing;

          return (
            <div key={day} className={isHoliday ? 'text-red-500' : ''}>
              {/* 영업 여부 */}
              {day}: {isHoliday ? '휴무' : `${h.opening} ~ ${h.closing}`}
              
              {/* 휴게 시간 표시 */}
              {!isHoliday && h?.breakStart && h?.breakEnd && (
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  (휴게 시간: {h.breakStart} ~ {h.breakEnd})
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="w-full space-y-6 mt-0 mb-6">
        <main
          className="w-full max-w-lg mx-auto bg-white dark:bg-gray-950 text-gray-900 
                     dark:text-gray-100 shadow-md text-sm mb-4 pb-4 pt-4 px-4 sm:px-6"
        >
          <div className="flex justify-between items-center flex-wrap gap-1 mb-2">
            {/* 상호명 + 업종 (모바일에서도 한 줄로) */}
            <div className="flex items-baseline gap-2 text-base sm:text-lg font-semibold truncate">
              <h4 className="font-bold text-xl truncate">{store.name}</h4>
              <span className="text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">{store.industry}</span>
            </div>

            <button
              onClick={() => router.back()}
              className="text-blue-600 dark:text-blue-400 text-sm hover:underline ml-auto"
              type="button"
            >
              ← 이전 페이지로
            </button>
          </div>

          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mt-2 mb-2">{store.description}</p>

          <div className="flex items-start mb-2">
            <div className="w-24 shrink-0 font-semibold">영업시간</div>
            <div className="flex-1 text-gray-800 dark:text-gray-200">
              {renderTodayBusinessHour()}
              <button
                onClick={() => setShowAllBusinessHours((prev) => !prev)}
                className="mt-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
              >
                {showAllBusinessHours ? '영업시간 숨기기' : '영업시간 보기'}
              </button>
              {showAllBusinessHours && renderAllBusinessHours()}
            </div>
          </div>

          <div className="flex items-start mb-2">
            <div className="w-24 shrink-0 font-semibold">휴무일</div>
            <div className="flex-1 text-gray-800 dark:text-gray-200">
              {store.holidayRule?.days?.join(', ') || '없음'}
              {store.holidayRule?.weeks?.length ? ` (매월 ${store.holidayRule.weeks.join(', ')}주차)` : ''}
            </div>
          </div>

          <div className="flex items-start mb-4">
            <div className="w-24 shrink-0 font-semibold">주소</div>
            <div className="flex-1 text-gray-800 dark:text-gray-200">
              {store.address} {store.detailAddress}
            </div>
          </div>

          <div className="flex items-start mb-4">
            <div className="w-24 shrink-0 font-semibold">홈페이지</div>
            <div className="flex-1 text-blue-600 dark:text-blue-400 break-all">
              {store.web ? (
                <a
                  href={store.web.startsWith('http') ? store.web : `https://${store.web}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {store.web}
                </a>
              ) : (
                <span className="text-gray-500 dark:text-gray-500">등록된 홈페이지 없음</span>
              )}
            </div>
          </div>

          <div
            ref={mapRef}
            className="relative z-0 w-full aspect-video border border-gray-200 dark:border-gray-700 rounded-md shadow-sm"
          />
        </main>

        <div ref={menuRef} className="w-full max-w-lg mx-auto px-4 sm:px-6">
          <MenuByCategory storeId={storeId} />
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-500
                    text-white p-3 rounded-full shadow-lg transition-opacity"
          aria-label="맨 위로"
        >
          <ArrowUpIcon className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
