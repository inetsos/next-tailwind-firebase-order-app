'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Store, BusinessHour, DayOfWeek, HolidayRule } from '@/types/store';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import BusinessHoursModal from '@/components/modals/BusinessHoursModal';
import HolidayRuleModal from '@/components/modals/HolidayRuleModal';

const categories = [
  '한식', '중식', '일식', '양식', '분식', '치킨', '피자', '패스트푸드',
  '고기/구이', '족발/보쌈', '찜/탕/찌개', '도시락', '야식', '해산물',
  '디저트', '베이커리', '카페', '커피/음료', '샐러드', '브런치', '기타',
];

const emptyBusinessHours: Record<DayOfWeek, BusinessHour> = {
  월: { opening: '', closing: '' },
  화: { opening: '', closing: '' },
  수: { opening: '', closing: '' },
  목: { opening: '', closing: '' },
  금: { opening: '', closing: '' },
  토: { opening: '', closing: '' },
  일: { opening: '', closing: '' },
};

const defaultHolidayRule: HolidayRule = {
  frequency: '매주',
  days: [],
};

export default function StoreRegisterPage() {
  const [form, setForm] = useState<Store>({
    category: '',
    name: '',
    description: '',
    zipcode: '',
    address: '',
    detailAddress: '',
    latitude: '',
    longitude: '',
    businessHours: emptyBusinessHours,
    holidayRule: defaultHolidayRule,
  });

  const [showBusinessHoursModal, setShowBusinessHoursModal] = useState(false);
  const [showHolidayRuleModal, setShowHolidayRuleModal] = useState(false);
  const router = useRouter();
  const { userData } = useUserStore();

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

    // 영업시간 하나라도 설정됐는지 체크
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
      <h1 className="text-2xl font-bold mb-2 -mt-4 dark:text-white">매장 등록</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* 업종 선택 */}
        <div>
          <label className="block font-semibold mb-2 dark:text-gray-200">업종 선택</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, category: c }))}
                className={`px-3 py-1.5 rounded-full border text-sm transition
                  ${form.category === c
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-600'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 텍스트 입력 필드 예시 */}
        <input
          type="text"
          name="name"
          placeholder="상호명"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
        />

        {/* textarea */}
        <textarea
          name="description"
          placeholder="소개말"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
        />

        {/* 영업시간 버튼 */}
        <button
          type="button"
          onClick={() => setShowBusinessHoursModal(true)}
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:text-white"
        >
          영업시간 설정
        </button>

        {/* 설정된 영업시간 표시 */}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {/* 그대로 유지 */}
        </div>

        {/* 휴무일 설정 버튼 */}
        <button
          type="button"
          onClick={() => setShowHolidayRuleModal(true)}
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:text-white"
        >
          휴무일 설정
        </button>

        {/* 휴무 규칙 요약 */}
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {form.holidayRule.frequency} {form.holidayRule.days.join(', ')}
          {form.holidayRule.weeks?.length
            ? ` (매월 ${form.holidayRule.weeks.join(', ')}주차)`
            : ''}
        </p>

        {/* 주소 필드들 */}
        <input
          type="text"
          name="zipcode"
          readOnly
          onClick={handleAddressSearch}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-800 text-black dark:text-white cursor-pointer"
        />

        {/* 위도 / 경도 필드 */}
        <div className="flex gap-4">
          <input
            type="text"
            name="latitude"
            readOnly
            onClick={handleOpenMap}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
          />
          <input
            type="text"
            name="longitude"
            readOnly
            onClick={handleOpenMap}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
          />
        </div>

        {/* 등록 버튼 */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-500"
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
