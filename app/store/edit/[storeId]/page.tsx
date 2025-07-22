'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, 
  orderBy, collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Store, BusinessHour, DayOfWeek, HolidayRule } from '@/types/store';
import { useUserStore } from '@/stores/userStore';
import Script from 'next/script';
import BusinessHoursModal from '@/components/modals/BusinessHoursModal';
import HolidayRuleModal from '@/components/modals/HolidayRuleModal';
import { cn } from '@/lib/utils'; // Tailwind 클래스 병합 유틸리티
import { generateKeywords } from '@/utils/generateKeywords';

const defaultHolidayRule: HolidayRule = {
  frequency: '매주',
  days: [],
};

export default function StoreEditPage() {
  const [form, setForm] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBusinessHoursModal, setShowBusinessHoursModal] = useState(false);
  const [showHolidayRuleModal, setShowHolidayRuleModal] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [categoryIndustries, setCategoryIndustries] = useState<string[]>([]); // Firestore에서 로드한 세부 업종

  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  const { userData } = useUserStore();

  // 매장 정보 불러오기
  useEffect(() => {
    if (!storeId) return;

    const fetchData = async () => {
      try {
        const docRef = doc(db, 'stores', storeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setForm(docSnap.data() as Store);
        } else {
          alert('매장 정보를 찾을 수 없습니다.');
          router.push('/');
        }
      } catch (e) {
        alert('매장 정보 불러오기 실패');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId, router]);

  // 카테고리 목록 불러오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const colRef = collection(db, 'store-categories');
        const q = query(colRef, orderBy('sortOrder'));
        const querySnapshot = await getDocs(q);
        const cats: string[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.name) cats.push(data.name);
        });
        setCategories(cats);
      } catch (error) {
        console.error('카테고리 목록 불러오기 실패:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // 카테고리에 따른 세부 업종 불러오기
  useEffect(() => {
    if (!form?.category) {
      setCategoryIndustries([]);
      return;
    }

    const fetchIndustries = async () => {
      try {
        const colRef = collection(db, 'store-categories');
        const q = query(colRef, orderBy('sortOrder'));
        const querySnapshot = await getDocs(q);
        const matchedDoc = querySnapshot.docs.find(doc => doc.data().name === form.category);
        if (matchedDoc) {
          const data = matchedDoc.data();
          setCategoryIndustries(data.industries || []);
        } else {
          setCategoryIndustries([]);
        }
      } catch (error) {
        console.error('세부 업종 로드 실패:', error);
        setCategoryIndustries([]);
      }
    };

    fetchIndustries();
  }, [form?.category]);

  // 카테고리 선택 시 처리
  const handleCategorySelect = (category: string) => {
    setForm(prev => prev ? { ...prev, category, industry: '' } : null); // category 바뀌면 industry 초기화
  };

  // 세부 업종 선택 시 처리
  const handleIndustrySelect = (industry: string) => {
    setForm(prev => prev ? { ...prev, industry } : null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (form) {
      setForm(prev => ({ ...prev!, [name]: value }));
    }
  };

  const handleAddressSearch = () => {
    if (!(window as any).daum?.Postcode) return;
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        setForm(prev => ({
          ...prev!,
          address: data.address,
          zipcode: data.zonecode,
        }));
      }
    }).open();
  };

  const handleOpenMap = () => {
    if (!form?.name || !form?.address) {
      alert('상호명과 주소를 입력해주세요.');
      return;
    }

    const query = new URLSearchParams({
      name: form.name,
      address: form.address,
      latitude: String(form.latitude),
      longitude: String(form.longitude),
    });

    const width = 800;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      `/naver-map-view?${query.toString()}`,
      'mapWindow',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'coords') {
        setForm(prev => ({
          ...prev!,
          latitude: event.data.lat.toString(),
          longitude: event.data.lng.toString(),
        }));
      }
    };
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData?.userId || !form) {
      alert('사용자 정보 또는 폼이 누락되었습니다.');
      return;
    }

    try {
      const storeRef = doc(db, 'stores', storeId!);
      await updateDoc(storeRef, {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),        
        name_keywords: generateKeywords(form.name.trim()),
        updatedAt: serverTimestamp(),
      });
      alert('매장 정보가 수정되었습니다.');
      router.push('/store/manage');
    } catch (error) {
      console.error(error);
      alert('수정에 실패했습니다.');
    }
  };

  if (loading || !form) return <p className="text-center mt-10">로딩 중...</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">매장 정보 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* 카테고리 선택 칩 */}
        <div>
          <label className="block font-semibold mb-2 dark:text-white">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">카테고리가 없습니다.</p>
            )}
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategorySelect(category)}
                className={cn(
                  'px-3 py-1 rounded-full border text-sm',
                  form.category === category
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 세부 업종 선택 칩 */}
        <div>
          <label className="block font-semibold mb-2 dark:text-white">업종</label>
          <div className="flex flex-wrap gap-2">
            {categoryIndustries.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">세부 업종이 없습니다.</p>
            )}
            {categoryIndustries.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleIndustrySelect(item)}
                className={cn(
                  'px-3 py-1 rounded-full border text-sm',
                  form.industry === item
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* 기본 입력 */}
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="상호명"
          className="w-full p-2 border text-xs rounded"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="소개말"
          className="w-full p-2 border text-xs rounded"
        />

        {/* 영업시간 설정 */}
        <button
          type="button"
          onClick={() => setShowBusinessHoursModal(true)}
          className="w-full p-2 text-xs border rounded"
        >
          영업시간 설정
        </button>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          {Object.entries(form.businessHours).every(([_, h]) => !h.opening && !h.closing) ? (
            <span className="italic">영업시간 미설정</span>
          ) : (
            <ul className="mt-0 space-y-1">
              {Object.entries(form.businessHours).map(([day, h]) => (
                <li key={day}>
                  <span className="font-semibold">{day}</span>:&nbsp;
                  {h.opening && h.closing ? (
                    <>
                      {h.opening} ~ {h.closing}
                      {h.breakStart && h.breakEnd ? (
                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                          (휴게 {h.breakStart} ~ {h.breakEnd})
                        </span>
                      ) : null}
                    </>
                  ) : (
                    '휴무'
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 휴무일 설정 */}
        <button
          type="button"
          onClick={() => setShowHolidayRuleModal(true)}
          className="w-full p-2 text-xs border rounded"
        >
          휴무일 설정
        </button>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {form.holidayRule?.frequency} {form.holidayRule?.days?.join(', ')}
          {form.holidayRule?.weeks?.length ? ` (매월 ${form.holidayRule.weeks.join(', ')}주차)` : ''} 휴무
        </p>

        {/* 주소 */}
        <input
          type="text"
          name="zipcode"
          value={form.zipcode}
          readOnly
          onClick={handleAddressSearch}
          placeholder="우편번호"
          className="w-full p-2 text-xs border rounded bg-gray-100 cursor-pointer"
        />
        <input
          type="text"
          name="address"
          value={form.address}
          readOnly
          onClick={handleAddressSearch}
          placeholder="주소"
          className="w-full p-2 text-xs border rounded bg-gray-100 cursor-pointer"
        />
        <input
          type="text"
          name="detailAddress"
          value={form.detailAddress}
          onChange={handleChange}
          placeholder="상세주소"
          className="w-full p-2 text-xs border rounded"
        />

        {/* 홈페이지 */}
        <input
          type="url"
          name="web"
          value={form.web || ''}
          onChange={handleChange}
          placeholder="홈페이지 URL (예: https://www.example.com)"
          className="w-full p-2 text-xs border rounded"
        />

        {/* 위도/경도 */}
        <div className="flex gap-2">
          <input
            type="text"
            name="latitude"
            value={form.latitude}
            readOnly
            onClick={handleOpenMap}
            placeholder="위도"
            className="w-full p-2 text-xs border rounded bg-gray-100 cursor-pointer"
          />
          <input
            type="text"
            name="longitude"
            value={form.longitude}
            readOnly
            onClick={handleOpenMap}
            placeholder="경도"
            className="w-full p-2 text-xs border rounded bg-gray-100 cursor-pointer"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="w-full text-xs bg-blue-600 text-white py-2 rounded"
          >
            수정하기
          </button>
          <button
            type="button"
            onClick={() => router.push(`/store/${storeId}`)}
            className="w-full text-xs bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
          >
            취소
          </button>
        </div>
      </form>

      {/* 모달 */}
      {showBusinessHoursModal && (
        <BusinessHoursModal
          defaultValue={form.businessHours}
          onSave={(updated) => {
            setForm(prev => ({ ...prev!, businessHours: updated }));
            setShowBusinessHoursModal(false);
          }}
          onCancel={() => setShowBusinessHoursModal(false)}
        />
      )}

      {showHolidayRuleModal && (
        <HolidayRuleModal
          isOpen={true}
          defaultValue={form.holidayRule || defaultHolidayRule}
          onSave={(updated) => {
            setForm(prev => ({ ...prev!, holidayRule: updated }));
            setShowHolidayRuleModal(false);
          }}
          onCancel={() => setShowHolidayRuleModal(false)}
        />
      )}

      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
    </div>
  );
}
