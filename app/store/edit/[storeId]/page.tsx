'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Store, BusinessHour, DayOfWeek, HolidayRule } from '@/types/store';
import { useUserStore } from '@/stores/userStore';
import Script from 'next/script';
import BusinessHoursModal from '@/components/modals/BusinessHoursModal';
import HolidayRuleModal from '@/components/modals/HolidayRuleModal';
import { useParams } from 'next/navigation';

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

export default function StoreEditPage() {
  const [form, setForm] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBusinessHoursModal, setShowBusinessHoursModal] = useState(false);
  const [showHolidayRuleModal, setShowHolidayRuleModal] = useState(false);

  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  const { userData } = useUserStore();

  // 매장 데이터 불러오기
  useEffect(() => {
    if (!storeId) return;

    const fetchData = async () => {
      const docRef = doc(db, 'stores', storeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setForm(docSnap.data() as Store);
      } else {
        alert('매장 정보를 찾을 수 없습니다.');
        router.push('/');
      }
      setLoading(false);
    };

    fetchData();
  }, [storeId, router]);

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
        updatedAt: serverTimestamp(),
      });
      alert('매장 정보가 수정되었습니다.');
      router.push('/');
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

        {/* 업종 */}
        <div>
          <label className="block font-semibold mb-2 dark:text-white">업종 선택</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(prev => ({ ...prev!, category: c }))}
                className={`px-3 py-1.5 rounded-full border text-xs
                  ${form.category === c
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-500 dark:hover:bg-gray-600'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="상호명" className="w-full p-2 border text-xs rounded" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="소개말" className="w-full p-2 border text-xs rounded" />

        {/* 영업시간 설정 */}
        <button type="button" onClick={() => setShowBusinessHoursModal(true)} className="w-full p-2 text-xs border rounded">영업시간 설정</button>
        <div className="text-xs">
          {(['월', '화', '수', '목', '금', '토', '일'] as DayOfWeek[]).map((day) => {
            const h = form.businessHours?.[day];
            return (
              <div key={day}>
                {day}: {h?.opening && h?.closing ? `${h.opening} ~ ${h.closing}` : '휴무'}
              </div>
            );
          })}
        </div>

        {/* 휴무일 설정 */}
        <button type="button" onClick={() => setShowHolidayRuleModal(true)} className="w-full p-2 text-xs border rounded">휴무일 설정</button>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {form.holidayRule?.frequency} {form.holidayRule?.days?.join(', ')}
          {form.holidayRule?.weeks?.length ? ` (매월 ${form.holidayRule.weeks.join(', ')}주차)` : ''} 휴무
        </p>

        {/* 주소 */}
        <input type="text" name="zipcode" value={form.zipcode} readOnly onClick={handleAddressSearch} placeholder="우편번호" className="w-full p-2 text-xs border rounded bg-gray-100 cursor-pointer" />
        <input type="text" name="address" value={form.address} readOnly onClick={handleAddressSearch} placeholder="주소" className="w-full p-2 text-xs border rounded bg-gray-100 cursor-pointer" />
        <input type="text" name="detailAddress" value={form.detailAddress} onChange={handleChange} placeholder="상세주소" className="w-full p-2 text-xs border rounded" />

        {/* 위도/경도 */}
        <div className="flex gap-2">
          <input type="text" name="latitude" value={form.latitude} readOnly onClick={handleOpenMap} placeholder="위도" className="w-full p-2 text-xs border rounded bg-gray-100 cursor-pointer" />
          <input type="text" name="longitude" value={form.longitude} readOnly onClick={handleOpenMap} placeholder="경도" className="w-full p-2 text-xs border rounded bg-gray-100 cursor-pointer" />
        </div>

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

      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
    </div>
  );
}
