'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/firebase/firebaseConfig';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Menu, MenuPrice, OptionGroup } from '@/types/menu';
import OptionGroupForm from './OptionGroupForm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MenuFormProps {
  storeId: string;
  menuData?: Menu; // 수정 시 초기값 전달
  onSubmit?: (menu: Omit<Menu, 'id'>) => Promise<void>; // 수정 시 콜백
}

export default function MenuForm({ storeId, menuData, onSubmit }: MenuFormProps) {
  //console.log('storeId: ', storeId);
  const [name, setName] = useState(menuData?.name || '');
  const [description, setDescription] = useState(menuData?.description || '');
  const [category, setCategory] = useState(menuData?.category || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(menuData?.imageUrl || '');
  const [isSoldOut, setIsSoldOut] = useState(menuData?.isSoldOut || false);

  const [prices, setPrices] = useState<MenuPrice[]>(menuData?.prices || []);
  const [sizeLabel, setSizeLabel] = useState('');
  const [sizePrice, setSizePrice] = useState<number>(0);

  const [requiredOptions, setRequiredOptions] = useState<OptionGroup[]>(menuData?.requiredOptions || []);
  const [optionalOptions, setOptionalOptions] = useState<OptionGroup[]>(menuData?.optionalOptions || []);

  const router = useRouter(); // 추가
  
  const handleImageUpload = async (): Promise<string> => {
    if (!imageFile) return imageUrl || '';
    const imageRef = ref(storage, `menus/${storeId}/${uuidv4()}`);
    await uploadBytes(imageRef, imageFile);
    return await getDownloadURL(imageRef);
  };

  const handleAddPrice = () => {
    if (!sizeLabel || sizePrice <= 0) {
      alert('규격명과 가격을 올바르게 입력하세요.');
      return;
    }

    setPrices((prev) => [...prev, { label: sizeLabel, price: sizePrice }]);
    setSizeLabel('');
    setSizePrice(0);
  };

  const handleRemovePrice = (index: number) => {
    setPrices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveOptionGroup = (index: number, isRequired: boolean) => {
    const update = (prev: OptionGroup[]) => prev.filter((_, i) => i !== index);
    isRequired
      ? setRequiredOptions(update)
      : setOptionalOptions(update);
  };

  const handleRemoveOptionItem = (
    groupIndex: number,
    optionIndex: number,
    isRequired: boolean
  ) => {
    const targetGroups = isRequired ? requiredOptions : optionalOptions;
    const updatedGroups = [...targetGroups];
    const updatedOptions = [...updatedGroups[groupIndex].options];
    updatedOptions.splice(optionIndex, 1);

    updatedGroups[groupIndex] = {
      ...updatedGroups[groupIndex],
      options: updatedOptions,
    };

    isRequired
      ? setRequiredOptions(updatedGroups)
      : setOptionalOptions(updatedGroups);
  };

  const handleSubmit = async () => {
    if (!name || prices.length === 0 || !category) {
      alert('이름, 가격, 분류를 입력하세요.');
      return;
    }

    const uploadedImageUrl = await handleImageUpload();

    const menu: Omit<Menu, 'id'> = {
      name,
      description,
      category,
      prices,
      imageUrl: uploadedImageUrl,
      isSoldOut,
      requiredOptions,
      optionalOptions,
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

    setName('');
    setDescription('');
    setCategory('');
    setPrices([]);
    setSizeLabel('');
    setSizePrice(0);
    setImageFile(null);
    setIsSoldOut(false);
    setRequiredOptions([]);
    setOptionalOptions([]);
    setImageUrl('');
  };

  return (
    <div className="space-y-6 text-sm max-w-xl mx-auto p-4 bg-white rounded shadow">
      {/* 🔗 메뉴 관리로 돌아가기 링크 */}
      <div className="text-right -mt-2">
        <button
          onClick={() => router.push(`/store/${storeId}/menus`)}
          className="text-blue-600 hover:underline text-sm"
        >
          ← 메뉴 관리
        </button>
      </div>

      <h2 className="text-lg font-semibold pb-2 -mt-6">
        📋 {menuData ? '메뉴 수정' : '메뉴 등록'}
      </h2>

      <div className="space-y-2 -mt-6">
        <input
          type="text"
          placeholder="메뉴 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="분류"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        {imageUrl && !imageFile && (
          <img
            src={imageUrl}
            alt="미리보기"
            className="w-24 h-24 object-cover rounded border mt-2"
          />
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold pb-2 mt-2">💰 규격 및 가격</h2>
        <div className="flex items-center gap-2 mt-0">
          <input
            type="text"
            placeholder="규격"
            value={sizeLabel}
            onChange={(e) => setSizeLabel(e.target.value)}
            className="border p-2 rounded w-1/3"
          />
          <input
            type="number"
            placeholder="가격"
            value={sizePrice}
            onChange={(e) => setSizePrice(Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="border p-2 rounded w-1/3"
          />
          <button
            type="button"
            onClick={handleAddPrice}
            className="bg-green-600 text-white px-4 py-2 rounded w-1/3 hover:bg-green-700 whitespace-nowrap"
          >
            추가
          </button>
        </div>

        {prices.length > 0 && (
          <ul className="mt-3 space-y-2">
            {prices.map((p, idx) => (
              <li
                key={idx}
                className="flex items-center gap-4 bg-gray-50 p-2 rounded border"
              >
                <span className="w-1/3 truncate">{p.label}</span>
                <span className="w-1/3">{p.price.toLocaleString()}원</span>
                <button
                  onClick={() => handleRemovePrice(idx)}
                  className="text-red-500 hover:text-red-700 text-xs bg-white border px-2 py-1 rounded"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2">
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
        <h2 className="text-lg font-semibold pb-2">⚙️ 필수 옵션</h2>
        <OptionGroupForm
          isRequired={true}
          onAdd={(group) => setRequiredOptions((prev) => [...prev, group])}
        />
        {requiredOptions.length > 0 && (
          <ul className="mt-2 space-y-2 text-sm">
            {requiredOptions.map((group, groupIdx) => (
              <li key={groupIdx} className="p-2 border rounded bg-gray-50">
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
                        onClick={() =>
                          handleRemoveOptionItem(groupIdx, optIdx, true)
                        }
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
        <h2 className="text-lg font-semibold pb-2">🧩 선택 옵션</h2>
        <OptionGroupForm
          isRequired={false}
          onAdd={(group) => setOptionalOptions((prev) => [...prev, group])}
        />
        {optionalOptions.length > 0 && (
          <ul className="mt-2 space-y-2 text-sm">
            {optionalOptions.map((group, groupIdx) => (
              <li key={groupIdx} className="p-2 border rounded bg-gray-50">
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
                        onClick={() =>
                          handleRemoveOptionItem(groupIdx, optIdx, false)
                        }
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

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!name || prices.length === 0 || !category}
          className={`w-full py-3 rounded text-white font-semibold transition ${
            !name || prices.length === 0 || !category
              ? 'bg-blue-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          ✅ {menuData ? '수정 완료' : '메뉴 등록'}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/store/${storeId}/menus`)}
          className="w-full py-3 rounded border border-gray-300  bg-gray-50 text-gray-700 font-semibold hover:bg-gray-100"
        >
          ❌ 취소
        </button>
      </div>
    </div>
  );
}