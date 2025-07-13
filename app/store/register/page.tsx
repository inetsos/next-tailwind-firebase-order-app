'use client';

import { useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp,
  query, where, getDocs
 } from 'firebase/firestore';
import { Store } from '@/types/store';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';

const categories = [
  '한식', '중식', '일식', '양식', '분식', '치킨', '피자', '패스트푸드',
  '고기/구이', '족발/보쌈', '찜/탕/찌개', '도시락', '야식', '해산물',
  '디저트', '베이커리', '카페', '커피/음료', '샐러드', '브런치', '기타',
];

export default function StoreRegisterPage() {
  const [form, setForm] = useState<Store>({
    category: '',
    name: '',
    description: '',
    openingTime: '',
    closingTime: '',
    zipcode: '',
    address: '',
    detailAddress: '',
    latitude: '',
    longitude: '',
  });

  const router = useRouter();
  const { userData } = useUserStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  // 자식 창에서 위도/경도 전달받기
  if (typeof window !== 'undefined') {
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'coords') {
        setForm(prev => ({
          ...prev,
          latitude: event.data.lat.toString(),
          longitude: event.data.lng.toString(),
        }));
      }
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData?.userId) {
      alert('사용자 정보가 없습니다. 로그인 상태를 확인해주세요.');
      return;
    }

    // 필수 입력값 검사
    const requiredFields = [
      { key: 'category', label: '업종' },
      { key: 'name', label: '상호명' },
      { key: 'description', label: '소개말' },
      { key: 'openingTime', label: '영업 시작 시간' },
      { key: 'closingTime', label: '영업 종료 시간' },
      { key: 'zipcode', label: '우편번호' },
      { key: 'address', label: '주소' },
      //{ key: 'detailAddress', label: '상세주소' },
      { key: 'latitude', label: '위도' },
      { key: 'longitude', label: '경도' },
    ];

    for (const field of requiredFields) {
      if (!form[field.key as keyof typeof form]) {
        alert(`${field.label}을(를) 입력해주세요.`);
        return;
      }
    }

    try {
      // ✅ 중복 상호+주소 체크
      const storesRef = collection(db, 'stores');
      const duplicateQuery = query(
        storesRef,
        where('name', '==', form.name.trim()),
        where('address', '==', form.address.trim())
      );

      const snapshot = await getDocs(duplicateQuery);

      if (!snapshot.empty) {
        alert(
          `이미 등록된 매장입니다.\n\n상호명: ${form.name}\n주소: ${form.address}`
        );
        return;
      }

      // ✅ 등록
      await addDoc(storesRef, {
        ...form,
        latitude: parseFloat(form.latitude as any),
        longitude: parseFloat(form.longitude as any),
        admin: userData.userId,
        createdAt: serverTimestamp(),
      });

      alert('매장이 등록되었습니다!');
      router.push('/store-list');
    } catch (error) {
      console.error(error);
      alert('등록 실패');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 -mt-6">매장 등록</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* 업종 선택 */}
        <div>
          <label className="block font-semibold mb-2">
            업종 선택 
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, category: c }))}
                className={`px-3 py-1.5 rounded-full border text-sm transition
                  ${form.category === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 상호 */}
        <input
          type="text"
          name="name"
          placeholder="상호명"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        {/* 소개말 */}
        <textarea
          name="description"
          placeholder="소개말"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        {/* 영업시간 */}
        <div className="flex gap-4 items-center">
          <div className="flex flex-col w-full">
            <label className="text-sm font-medium text-gray-700">영업 시작 시간</label>
            <input
              type="time"
              name="openingTime"
              value={form.openingTime}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex flex-col w-full">
            <label className="text-sm font-medium text-gray-700">영업 종료 시간</label>
            <input
              type="time"
              name="closingTime"
              value={form.closingTime}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* 우편번호 및 주소 */}
        <input
          type="text"
          name="zipcode"
          placeholder="우편번호 (클릭하여 검색)"
          value={form.zipcode}
          readOnly
          onClick={handleAddressSearch}
          className="w-full p-2 border rounded bg-gray-100 cursor-pointer"
        />
        <input
          type="text"
          name="address"
          placeholder="주소"
          value={form.address}
          readOnly
          onClick={handleAddressSearch}
          className="w-full p-2 border rounded bg-gray-100 cursor-pointer"
        />
        <input
          type="text"
          name="detailAddress"
          placeholder="상세주소"
          value={form.detailAddress}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        {/* 위도 / 경도 */}
        <div className="flex gap-4">
          <input
            type="text"
            name="latitude"
            placeholder="위도"
            value={form.latitude}
            onClick={handleOpenMap}
            readOnly
            className="w-full p-2 border rounded placeholder:text-gray-400"
          />
          <input
            type="text"
            name="longitude"
            placeholder="경도"
            value={form.longitude}
            onClick={handleOpenMap}
            readOnly
            className="w-full p-2 border rounded placeholder:text-gray-400"
          />
        </div>

        {/* 등록 버튼 */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          등록하기
        </button>
      </form>

      {/* 카카오 주소 API */}
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
    </div>
  );
}