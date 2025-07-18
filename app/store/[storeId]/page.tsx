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
  const menuRef = useRef<HTMLDivElement | null>(null); // 메뉴 영역 참조
  const { userData } = useUserStore();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 스크롤 버튼 노출 제어
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

  // 매장 데이터 로드
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

  // 주문 후 돌아온 경우 메뉴 영역으로 스크롤
  useEffect(() => {
    if (!store) return; // store가 준비되어야 메뉴 영역 렌더됨

    const scrolledFromOrder = sessionStorage.getItem('scrollToMenu') === 'true';
    if (scrolledFromOrder) {
      setTimeout(() => {
        if (menuRef.current) {
          const navbarHeight = 56; // 고정 navbar 높이(px), 상황에 맞게 조절하세요
          const menuTop = menuRef.current.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: menuTop - navbarHeight, behavior: 'smooth' });
          sessionStorage.removeItem('scrollToMenu');
        } else {
          console.warn('menuRef.current is still null');
        }
      }, 100);
    }
  }, [store]);

  // 지도 표시
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
          <div style="padding:10px; background-color: ${isDark ? '#1f2937' : '#ffffff'}; color: ${isDark ? '#e5e7eb' : '#111827'}; border-radius: 8px; font-size: 10px;">
            <strong>${name}</strong><br/>${address}
          </div>`,
      });
      infoWindow.open(map, marker);
    };
    initMap();
  }, [store]);

  if (loading || !store) return <p className="p-6 text-center">로딩 중...</p>;

  // 이번 달 몇째 주인지 계산 함수
  const getWeekNumberOfMonth = (date: Date): number => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const offset = first.getDay();
    return Math.ceil((date.getDate() + offset) / 7);
  };

  // 오늘 영업시간 렌더링
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

  // 전체 영업시간 렌더링
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
    <>
      <div className="w-full space-y-6">
        {/* 매장 정보 메인 섹션 */}
        <main className="w-full bg-white dark:bg-gray-900 text-gray-900
                       dark:text-white shadow-md text-sm mb-10 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
              <h4 className="font-bold text-sm">{store.name}</h4>
              <p className="text-gray-600 dark:text-gray-400">{store.category}</p>
            </div>

            {userData?.userId === store.admin && (
              <div className="flex gap-2 flex-wrap">
                <Link
                  href={`/store/edit/${store.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md flex items-center gap-1 text-sm"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  정보 수정
                </Link>
                <Link
                  href={`/store/${store.id}/menus?name=${encodeURIComponent(store.name)}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md flex items-center gap-1 text-sm"
                >
                  <Squares2X2Icon className="w-4 h-4" />
                  메뉴 관리
                </Link>
              </div>
            )}
          </div>

          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">{store.description}</p>

          <div className="flex items-start mb-2">
            <div className="w-24 shrink-0 font-semibold">영업시간</div>
            <div className="flex-1 text-gray-800 dark:text-gray-200">
              {renderTodayBusinessHour()}
              <button
                onClick={() => setShowAllBusinessHours((prev) => !prev)}
                className="mt-1 text-blue-600 dark:text-blue-400 hover:underline"
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

          <div ref={mapRef} className="w-full aspect-video border rounded-md shadow-md dark:border-gray-600" />
        </main>

        {/* 메뉴 영역 */}
        <div ref={menuRef} className="w-full px-4 sm:px-6">
          <MenuByCategory storeId={storeId} />
        </div>
      </div>

      {/* 맨 위로 버튼 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700
                    text-white p-3 rounded-full shadow-lg transition-opacity"
          aria-label="맨 위로"
        >
          <ArrowUpIcon className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
