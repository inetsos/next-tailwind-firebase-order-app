'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/firebase/firebaseConfig';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Menu, MenuPrice, OptionGroup } from '@/types/menu';
import OptionGroupForm from './OptionGroupForm';
import { useRouter } from 'next/navigation';
import { logEvent } from '@/utils/logger';

interface MenuFormProps {
  storeId: string;
  menuData?: Menu;
  onSubmit?: (menu: Omit<Menu, 'id'>) => Promise<void>;
}

export default function MenuForm({ storeId, menuData, onSubmit }: MenuFormProps) {
  const [name, setName] = useState(menuData?.name || '');
  const [description, setDescription] = useState(menuData?.description || '');
  const [sortOrder, setSortOrder] = useState<number>(menuData?.sortOrder ?? 0);
  const [category, setCategory] = useState(menuData?.category || '');
  const [categories, setCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(menuData?.imageUrl || '');
  const [isSoldOut, setIsSoldOut] = useState(menuData?.isSoldOut || false);

  // 단일 가격 여부 상태 (menuData.price가 있으면 단일 가격 모드로 초기화)
  const [isSinglePrice, setIsSinglePrice] = useState<boolean>(
    menuData ? !!menuData.price : true
  );

  // 단일 가격
  const [singlePrice, setSinglePrice] = useState<number>(menuData?.price ?? 0);

  // 다중 가격
  const [prices, setPrices] = useState<MenuPrice[]>(menuData?.prices || []);
  const [sizeLabel, setSizeLabel] = useState('');
  const [sizePrice, setSizePrice] = useState<number>(0);

  const [requiredOptions, setRequiredOptions] = useState<OptionGroup[]>(menuData?.requiredOptions || []);
  const [optionalOptions, setOptionalOptions] = useState<OptionGroup[]>(menuData?.optionalOptions || []);

  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categorySnap = await getDocs(collection(db, 'stores', storeId, 'categories'));
        const categoryList = categorySnap.docs
          .map(doc => {
            const data = doc.data();
            return {
              name: data.name,
              sortOrder: data.sortOrder ?? 0,
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder);
        setCategories(categoryList.map(cat => cat.name));
      } catch (error) {
        await logEvent('error', '카테고리 불러오기 실패', { error });
      }
    }
    fetchCategories();
  }, [storeId]);

  const handleImageUpload = async (): Promise<string> => {
    if (!imageFile) return imageUrl || '';
    try {
      const imageRef = ref(storage, `menus/${storeId}/${uuidv4()}`);
      await uploadBytes(imageRef, imageFile);
      const url = await getDownloadURL(imageRef);
      return url;
    } catch (error) {
      await logEvent('error', '메뉴 이미지 업로드 실패', { error });
      alert('이미지 업로드 중 오류가 발생했습니다.');
      return imageUrl || '';
    }
  };

  const handleAddPrice = () => {
    if (!sizeLabel.trim() || sizePrice <= 0) {
      alert('규격명과 가격을 올바르게 입력하세요.');
      return;
    }
    setPrices((prev) => [...prev, { label: sizeLabel.trim(), price: sizePrice }]);
    setSizeLabel('');
    setSizePrice(0);
  };

  const handleRemovePrice = (index: number) => {
    setPrices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveOptionGroup = (index: number, isRequired: boolean) => {
    const update = (prev: OptionGroup[]) => prev.filter((_, i) => i !== index);
    isRequired ? setRequiredOptions(update) : setOptionalOptions(update);
  };

  const handleRemoveOptionItem = (groupIndex: number, optionIndex: number, isRequired: boolean) => {
    const targetGroups = isRequired ? requiredOptions : optionalOptions;
    const updatedGroups = [...targetGroups];
    const updatedOptions = [...updatedGroups[groupIndex].options];
    updatedOptions.splice(optionIndex, 1);
    updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], options: updatedOptions };
    isRequired ? setRequiredOptions(updatedGroups) : setOptionalOptions(updatedGroups);
  };

  const handleSubmit = async () => {
    if (!name || !category) {
      alert('이름과 분류를 입력하세요.');
      return;
    }
    if (isSinglePrice && singlePrice <= 0) {
      alert('단일 가격을 0원 초과로 입력하세요.');
      return;
    }
    if (!isSinglePrice && prices.length === 0) {
      alert('최소 한 개 이상의 가격을 등록하세요.');
      return;
    }

    try {
      const uploadedImageUrl = await handleImageUpload();

      const menu: Omit<Menu, 'id'> = {
        name,
        description,
        category,
        imageUrl: uploadedImageUrl,
        isSoldOut,
        requiredOptions,
        optionalOptions,
        sortOrder,
        ...(isSinglePrice
          ? { price: singlePrice, prices: [] }
          : { prices, price: 0 }),
      };

      if (onSubmit) {
        await onSubmit(menu);
      } else {
        await addDoc(collection(db, 'stores', storeId, 'menus'), {
          storeId,
          ...menu,
        });
        alert('메뉴가 등록되었습니다.');
      }

      await logEvent('info', '메뉴 등록 완료', { storeId, menuName: name });

      // 초기화
      setName('');
      setDescription('');
      setCategory('');
      setSortOrder(0);
      setSinglePrice(0);
      setPrices([]);
      setSizeLabel('');
      setSizePrice(0);
      setImageFile(null);
      setIsSoldOut(false);
      setRequiredOptions([]);
      setOptionalOptions([]);
      setImageUrl('');
      setIsSinglePrice(true);

      router.push(`/store/${storeId}/menus`);
    } catch (error) {
      await logEvent('error', '메뉴 등록 실패', {
        storeId,
        menuName: name,
        error: error instanceof Error ? error.message : String(error),
      });

      //await logEvent('error', '메뉴 등록 실패', { storeId, menuName: name, error });
      alert('메뉴 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6 text-sm max-w-xl mx-auto p-4 bg-white rounded shadow dark:bg-gray-900 dark:text-gray-100">
      <div className="text-right -mt-2">
        <button
          onClick={() => router.push(`/store/${storeId}/menus`)}
          className="text-blue-600 hover:underline text-sm dark:text-blue-400"
        >
          ← 메뉴 관리
        </button>
      </div>

      <h2 className="text-lg font-semibold pb-2 -mt-6">
        📋 {menuData ? '메뉴 수정' : '메뉴 등록'}
      </h2>

      <div className="space-y-2 -mt-6">
        {/* 카테고리 선택 */}
        <div className="space-y-1">
          <label className="block font-medium"><strong>카테고리 *</strong></label>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-1 rounded-full border text-sm transition ${
                  category === cat
                    ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 메뉴 이름 */}
        <div className="space-y-1">
          <label className="block font-medium"><strong>메뉴 이름 *</strong></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>

        {/* 설명 */}
        <div className="space-y-1">
          <label className="block font-medium"><strong>설명</strong></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>

        {/* 정렬 순서 */}
        <div className="space-y-1">
          <label className="block font-medium"><strong>정렬 순서</strong></label>
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>

        {/* 이미지 업로드 */}
        <label htmlFor="image-upload" className="font-semibold">
          메뉴 이미지
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full text-gray-700 dark:text-gray-300"
        />
        {imageUrl && !imageFile && (
          <img
            src={imageUrl}
            alt="미리보기"
            className="w-24 h-24 object-cover rounded border mt-2 dark:border-gray-700"
          />
        )}
      </div>

      {/* 단일 / 다중 가격 토글 */}
      <div className="mt-4">
        <label className="font-semibold mb-2 block">가격 형태 *</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              checked={isSinglePrice}
              onChange={() => setIsSinglePrice(true)}
              className="w-4 h-4"
            />
            단일 가격
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              checked={!isSinglePrice}
              onChange={() => setIsSinglePrice(false)}
              className="w-4 h-4"
            />
            다중 가격 (규격별)
          </label>
        </div>
      </div>

      {/* 가격 입력 UI */}
      {isSinglePrice ? (
        <div className="mt-3">
          <label className="block font-medium">가격 *</label>
          <input
            type="number"
            min={0}
            value={singlePrice}
            onChange={(e) => setSinglePrice(Number(e.target.value))}
            className="border p-2 rounded w-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="규격"
              value={sizeLabel}
              onChange={(e) => setSizeLabel(e.target.value)}
              className="border p-2 rounded w-1/3 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
            <input
              type="number"
              placeholder="가격"
              value={sizePrice}
              onChange={(e) => setSizePrice(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              className="border p-2 rounded w-1/3 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={handleAddPrice}
              className="bg-green-600 text-white px-4 py-2 rounded w-1/3 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 whitespace-nowrap"
            >
              추가
            </button>
          </div>

          {prices.length > 0 && (
            <ul className="mt-3 space-y-2">
              {prices.map((p, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-2 rounded border dark:border-gray-700"
                >
                  <span className="w-1/3 truncate">{p.label}</span>
                  <span className="w-1/3">{p.price.toLocaleString()}원</span>
                  <button
                    onClick={() => handleRemovePrice(idx)}
                    className="text-red-500 hover:text-red-700 text-xs bg-white border px-2 py-1 rounded dark:bg-gray-900 dark:border-red-700 dark:text-red-400 dark:hover:text-red-600"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 품절 상태 */}
      <div className="flex items-center gap-2 mt-4">
        <input
          type="checkbox"
          checked={isSoldOut}
          onChange={() => setIsSoldOut(!isSoldOut)}
          className="w-4 h-4"
        />
        <label>품절 상태</label>
      </div>

      {/* 필수 옵션 */}
      <div>
        <h2 className="text-lg font-semibold pb-2 mt-6">⚙️ 필수 옵션</h2>
        <OptionGroupForm
          isRequired={true}
          onAdd={(group) => setRequiredOptions((prev) => [...prev, group])}
        />
        {requiredOptions.length > 0 && (
          <ul className="mt-2 space-y-2 text-sm">
            {requiredOptions.map((group, groupIdx) => (
              <li key={groupIdx} className="p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <strong>{group.name}</strong>
                  <button
                    onClick={() => handleRemoveOptionGroup(groupIdx, true)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    그룹 삭제
                  </button>
                </div>
                <ul className="pl-4 list-disc">
                  {group.options.map((opt, optIdx) => (
                    <li key={optIdx} className="flex justify-between pr-2">
                      <span>
                        {opt.name} - {opt.price.toLocaleString()}원
                      </span>
                      <button
                        onClick={() => handleRemoveOptionItem(groupIdx, optIdx, true)}
                        className="text-xs text-red-400 hover:underline ml-2"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 선택 옵션 */}
      <div>
        <h2 className="text-lg font-semibold pb-2 mt-4">🧩 선택 옵션</h2>
        <OptionGroupForm
          isRequired={false}
          onAdd={(group) => setOptionalOptions((prev) => [...prev, group])}
        />
        {optionalOptions.length > 0 && (
          <ul className="mt-2 space-y-2 text-sm">
            {optionalOptions.map((group, groupIdx) => (
              <li key={groupIdx} className="p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <strong>{group.name}</strong>
                  <button
                    onClick={() => handleRemoveOptionGroup(groupIdx, false)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    그룹 삭제
                  </button>
                </div>
                <ul className="pl-4 list-disc">
                  {group.options.map((opt, optIdx) => (
                    <li key={optIdx} className="flex justify-between pr-2">
                      <span>
                        {opt.name} - {opt.price.toLocaleString()}원
                      </span>
                      <button
                        onClick={() => handleRemoveOptionItem(groupIdx, optIdx, false)}
                        className="text-xs text-red-400 hover:underline ml-2"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 제출 / 취소 버튼 */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={handleSubmit}
          disabled={
            !name ||
            !category ||
            (isSinglePrice ? singlePrice <= 0 : prices.length === 0)
          }
          className={`w-full py-3 rounded text-white font-semibold transition ${
            !name || !category || (isSinglePrice ? singlePrice <= 0 : prices.length === 0)
              ? 'bg-blue-600 dark:bg-blue-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          ✅ {menuData ? '수정 완료' : '메뉴 등록'}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/store/${storeId}/menus`)}
          className="w-full py-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          ❌ 취소
        </button>
      </div>
    </div>
  );
}
