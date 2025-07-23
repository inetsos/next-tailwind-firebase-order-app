'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { Store, BusinessHour, DayOfWeek, HolidayRule } from '@/types/store';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import BusinessHoursModal from '@/components/modals/BusinessHoursModal';
import HolidayRuleModal from '@/components/modals/HolidayRuleModal';
import CategoryFromSearchParams from '@/components/CategoryFromSearchParams';
import { Suspense } from 'react';
import { generateAdvancedSearchKeywords } from '@/utils/keywords';

const emptyBusinessHours: Record<DayOfWeek, BusinessHour> = {
  월: { opening: '', closing: '', breakStart: '', breakEnd: '' },
  화: { opening: '', closing: '', breakStart: '', breakEnd: '' },
  수: { opening: '', closing: '', breakStart: '', breakEnd: '' },
  목: { opening: '', closing: '', breakStart: '', breakEnd: '' },
  금: { opening: '', closing: '', breakStart: '', breakEnd: '' },
  토: { opening: '', closing: '', breakStart: '', breakEnd: '' },
  일: { opening: '', closing: '', breakStart: '', breakEnd: '' },
};

const defaultHolidayRule: HolidayRule = {
  frequency: '매주',
  days: [],
};

interface Category {
  id: string;
  name: string;
  industries?: string[]; // 상세 업종 리스트 (optional)
}

export default function StoreRegisterPage() {
  const [form, setForm] = useState<Store & { industry?: string }>({
    category: '',
    industry: '',
    name: '',
    description: '',
    zipcode: '',
    address: '',
    detailAddress: '',
    latitude: '',
    longitude: '',
    businessHours: emptyBusinessHours,
    holidayRule: defaultHolidayRule,
    admin: '',
    web: '',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIndustries, setSelectedCategoryIndustries] = useState<string[]>([]);

  const [showBusinessHoursModal, setShowBusinessHoursModal] = useState(false);
  const [showHolidayRuleModal, setShowHolidayRuleModal] = useState(false);
  const router = useRouter();
  const { userData } = useUserStore();
  
  // 카테고리 리스트 Firestore에서 불러오기 (industries 포함)
  useEffect(() => {
    const fetchCategories = async () => {
      const q = query(collection(db, 'store-categories'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Category, 'id'>;
        return { ...data, id: doc.id };
      });
      setCategories(list);
    };
    fetchCategories();
  }, []);

  // URL 쿼리에서 categoryId가 있으면 해당 카테고리 이름으로 폼 업데이트
  // useEffect(() => {
  //   const categoryId = searchParams.get('categoryId');
  //   if (!categoryId) return;

  //   const fetchCategoryName = async () => {
  //     try {
  //       const docRef = doc(db, 'store-categories', categoryId);
  //       const snapshot = await getDoc(docRef);
  //       if (snapshot.exists()) {
  //         const data = snapshot.data();
  //         setForm(prev => ({ ...prev, category: data.name, industry: '' })); // industry 초기화
  //       }
  //     } catch (error) {
  //       console.error('카테고리 조회 오류:', error);
  //     }
  //   };

  //   fetchCategoryName();
  // }, [searchParams]);

  // 선택한 카테고리 변경 시 industries 리스트를 찾아 상태에 저장
  useEffect(() => {
    if (!form.category) {
      setSelectedCategoryIndustries([]);
      return;
    }
    const found = categories.find(c => c.name === form.category);
    if (found && found.industries) {
      setSelectedCategoryIndustries(found.industries);
    } else {
      setSelectedCategoryIndustries([]);
    }
  }, [form.category, categories]);

  // 세부 업종 선택 토글 (radio 방식)
  const handleSelectIndustry = (industry: string) => {
    setForm(prev => ({
      ...prev,
      industry: prev.industry === industry ? '' : industry,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSearch = () => {
    if (typeof window === 'undefined' || !(window as any).daum?.Postcode) return;
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        setForm(prev => ({
          ...prev,
          address: data.address,
          zipcode: data.zonecode,
        }));
      }
    }).open();
  };

  const handleOpenMap = () => {
    if (!form.name || !form.address) {
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
          ...prev,
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

    if (!userData?.userId) {
      alert('사용자 정보가 없습니다. 로그인 상태를 확인해주세요.');
      return;
    }

    const requiredFields = [
      { key: 'category', label: '업종' },
      { key: 'industry', label: '세부 업종' },
      { key: 'name', label: '상호명' },
      { key: 'description', label: '소개말' },
      { key: 'zipcode', label: '우편번호' },
      { key: 'address', label: '주소' },
      { key: 'latitude', label: '위도' },
      { key: 'longitude', label: '경도' },
    ];

    for (const field of requiredFields) {
      if (!form[field.key as keyof typeof form]) {
        alert(`${field.label}을(를) 입력해주세요.`);
        return;
      }
    }

    const hasValidHours = Object.values(form.businessHours).some(
      (day) => day.opening && day.closing
    );
    if (!hasValidHours) {
      alert('영업시간을 설정해주세요.');
      return;
    }

    try {
      const storesRef = collection(db, 'stores');
      const duplicateQuery = query(
        storesRef,
        where('name', '==', form.name.trim()),
        where('address', '==', form.address.trim())
      );

      const snapshot = await getDocs(duplicateQuery);

      if (!snapshot.empty) {
        alert(`이미 등록된 매장입니다.\n\n상호명: ${form.name}\n주소: ${form.address}`);
        return;
      }

      await addDoc(storesRef, {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        admin: userData.userId,
        name_keywords: generateAdvancedSearchKeywords(form.name.trim()),
        createdAt: serverTimestamp(),
      });

      alert('매장이 등록되었습니다!');
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('등록 실패');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-3">
      <h1 className="text-2xl font-bold mb-2 dark:text-white">매장 등록</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. category는 변경 불가 텍스트로 보여주기 */}
        
        <div className="mb-4 space-y-2">
          {/* 비동기 카테고리 선택 */}
          <Suspense fallback={null}>
            <CategoryFromSearchParams
              onSetCategory={(category) => {
                setForm((prev) => ({
                  ...prev,
                  category,
                  industry: '', // 업종 초기화
                }));
              }}
            />
          </Suspense>

          {/* 선택된 카테고리 표시 */}
          <div className="flex items-center gap-2">
            <label className="font-semibold dark:text-gray-200">카테고리</label>
            <p className="px-3 py-1 border rounded bg-gray-100 text-sm dark:bg-gray-700 dark:text-gray-300">
              {form.category || '선택된 업종 없음'}
            </p>
          </div>
        </div>

        {/* 2. industry 선택 chip 버튼 */}
        <div>
          <label className="block font-semibold mb-2 dark:text-gray-200">업종</label>
          {selectedCategoryIndustries.length === 0 ? (
            <p className="text-xs italic text-gray-500 dark:text-gray-400">업종이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedCategoryIndustries.map((industry) => {
                const selected = form.industry === industry;
                return (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => handleSelectIndustry(industry)}
                    className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer
                      ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-600'
                      }`}
                  >
                    {industry}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 상호명 */}
        <input
          type="text"
          name="name"
          placeholder="상호명"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border text-xs rounded
            border-gray-300 bg-white text-black
            placeholder-gray-400
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />

        {/* 소개말 */}
        <textarea
          name="description"
          placeholder="소개말"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border text-xs rounded
            border-gray-300 bg-white text-black
            placeholder-gray-400
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />

        {/* 영업시간 설정 버튼 */}
        <button
          type="button"
          onClick={() => setShowBusinessHoursModal(true)}
          className="w-full p-2 rounded border text-xs
            bg-gray-100 text-gray-900
            dark:bg-gray-700 dark:text-white dark:border-gray-600
            hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          영업시간 설정
        </button>

        {/* 설정된 영업시간 보기 */}
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


        {/* 휴무일 설정 버튼 */}
        <button
          type="button"
          onClick={() => setShowHolidayRuleModal(true)}
          className="w-full p-2 rounded border text-xs
            bg-gray-100 text-gray-900
            dark:bg-gray-700 dark:text-white dark:border-gray-600
            hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          휴무일 설정
        </button>

        {/* 휴무 규칙 요약 */}
        <p className="mt-0 text-xs text-gray-600 dark:text-gray-300">
          {form.holidayRule.frequency} {form.holidayRule.days.join(', ')}
          {form.holidayRule.weeks?.length
            ? ` (매월 ${form.holidayRule.weeks.join(', ')}주차)`
            : ''} 휴무
        </p>

        {/* 우편번호 */}
        <input
          type="text"
          name="zipcode"
          placeholder="우편번호 (클릭하여 검색)"
          value={form.zipcode}
          readOnly
          onClick={handleAddressSearch}
          className="w-full p-2 text-xs rounded border cursor-pointer
            border-gray-300 bg-gray-100 text-black placeholder-gray-400
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />

        {/* 주소 */}
        <input
          type="text"
          name="address"
          placeholder="주소"
          value={form.address}
          readOnly
          onClick={handleAddressSearch}
          className="w-full p-2 text-xs rounded border cursor-pointer
            border-gray-300 bg-gray-100 text-black placeholder-gray-400
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />

        {/* 상세주소 */}
        <input
          type="text"
          name="detailAddress"
          placeholder="상세주소"
          value={form.detailAddress}
          onChange={handleChange}
          className="w-full p-2 text-xs rounded border
            border-gray-300 bg-white text-black placeholder-gray-400
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />

        {/* 홈페이지 */}
        <input
          type="url"
          name="web"
          placeholder="홈페이지 URL (예: https://www.example.com)"
          value={form.web}
          onChange={handleChange}
          className="w-full p-2 text-xs rounded border
            border-gray-300 bg-white text-black placeholder-gray-400
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />

        {/* 위도 / 경도 */}
        <div className="flex gap-4">
          <input
            type="text"
            name="latitude"
            placeholder="위도"
            value={form.latitude}
            readOnly
            onClick={handleOpenMap}
            className="w-full p-2 rounded border text-xs cursor-pointer
              border-gray-300 bg-gray-100 text-black
              dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="text"
            name="longitude"
            placeholder="경도"
            value={form.longitude}
            readOnly
            onClick={handleOpenMap}
            className="w-full p-2 rounded border text-xs cursor-pointer
              border-gray-300 bg-gray-100 text-black
              dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* 등록 버튼 */}
        <button
          type="submit"
          className="w-full text-xs py-2 rounded bg-blue-600 text-white
            hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
        >
          등록하기
        </button>
      </form>

      {showBusinessHoursModal && (
        <BusinessHoursModal
          defaultValue={form.businessHours}
          onSave={(updatedHours) => {
            setForm(prev => ({ ...prev, businessHours: updatedHours }));
            setShowBusinessHoursModal(false);
          }}
          onCancel={() => setShowBusinessHoursModal(false)}
        />
      )}

      {showHolidayRuleModal && (
        <HolidayRuleModal
          isOpen={true}
          defaultValue={form.holidayRule ?? defaultHolidayRule}
          onSave={(updatedRule) => {
            setForm(prev => ({ ...prev, holidayRule: updatedRule }));
            setShowHolidayRuleModal(false);
          }}
          onCancel={() => setShowHolidayRuleModal(false)}
        />
      )}

      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
    </div>
  );
}
