'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Menu, OptionGroup } from '@/types/menu';
import { useCart } from '@/context/CartContext';

export default function OnlineOrderPage() {
  const params = useParams();
  const router = useRouter();

  const rawStoreId = params.storeId;
  const rawMenuId = params.menuId;
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;
  const menuId = Array.isArray(rawMenuId) ? rawMenuId[0] : rawMenuId;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPriceIdx, setSelectedPriceIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  const [selectedRequiredOptions, setSelectedRequiredOptions] = useState<number[]>([]);
  const [selectedOptionalOptions, setSelectedOptionalOptions] = useState<number[][]>([]);

  const { addItem } = useCart();

  // 매장 이름 불러오기
  useEffect(() => {
    if (!storeId) return;
    const fetchStore = async () => {
      const storeRef = doc(db, 'stores', storeId);
      const snap = await getDoc(storeRef);
      if (snap.exists()) {
        const data = snap.data();
        setStoreName(data.name || '');
        console.log('매장명 불러옴:', data.name);
      }
    };
    fetchStore();
  }, [storeId]);

  // 메뉴 정보 불러오기
  useEffect(() => {
    const fetchMenu = async () => {
      if (!storeId || !menuId) return;
      const menuRef = doc(db, 'stores', storeId, 'menus', menuId);
      const snap = await getDoc(menuRef);
      if (snap.exists()) {
        const data = snap.data();
        setMenu({ id: snap.id, ...data } as Menu);
        console.log('메뉴 정보 불러옴:', { id: snap.id, ...data });

        if (data.requiredOptions && data.requiredOptions.length > 0) {
          setSelectedRequiredOptions(
            (data.requiredOptions as OptionGroup[]).map(
              (group: OptionGroup) => (group.options.length > 0 ? 0 : -1)
            )
          );
          console.log('초기 필수 옵션 설정됨');
        } else {
          setSelectedRequiredOptions([]);
        }
        if (data.optionalOptions && data.optionalOptions.length > 0) {
          setSelectedOptionalOptions(data.optionalOptions.map(() => []));
          console.log('초기 선택 옵션 설정됨');
        } else {
          setSelectedOptionalOptions([]);
        }
      }
      setLoading(false);
    };
    fetchMenu();
  }, [storeId, menuId]);

  if (!storeId || !menuId) return <p className="p-4 text-center text-sm">잘못된 접근입니다.</p>;
  if (loading) return <p className="p-4 text-center text-sm">⏳ 로딩 중...</p>;
  if (!menu) return <p className="p-4 text-center text-sm">❌ 메뉴 정보를 불러올 수 없습니다.</p>;

  const selectedPrice = menu.prices[selectedPriceIdx];

  const requiredOptionsPrice = selectedRequiredOptions.reduce((sum, optionIdx, groupIdx) => {
    const group = menu.requiredOptions?.[groupIdx];
    if (!group) return sum;
    if (optionIdx === -1) return sum;
    return sum + (group.options[optionIdx]?.price || 0);
  }, 0);

  const optionalOptionsPrice = selectedOptionalOptions.reduce((sum, optionIndexes, groupIdx) => {
    const group = menu.optionalOptions?.[groupIdx];
    if (!group) return sum;
    const groupSum = optionIndexes.reduce((groupSum, optionIdx) => {
      return groupSum + (group.options[optionIdx]?.price || 0);
    }, 0);
    return sum + groupSum;
  }, 0);

  const total = (selectedPrice.price + requiredOptionsPrice + optionalOptionsPrice) * quantity;

  const onChangeRequiredOption = (groupIdx: number, optionIdx: number) => {
    setSelectedRequiredOptions(prev => {
      const newArr = [...prev];
      newArr[groupIdx] = optionIdx;
      console.log(`필수 옵션 변경 - 그룹 ${groupIdx}, 옵션 ${optionIdx}`);
      return newArr;
    });
  };

  const onToggleOptionalOption = (groupIdx: number, optionIdx: number) => {
    setSelectedOptionalOptions(prev => {
      const newArr = [...prev];
      const groupSelected = newArr[groupIdx] || [];
      if (groupSelected.includes(optionIdx)) {
        newArr[groupIdx] = groupSelected.filter(idx => idx !== optionIdx);
        console.log(`선택 옵션 해제 - 그룹 ${groupIdx}, 옵션 ${optionIdx}`);
      } else {
        newArr[groupIdx] = [...groupSelected, optionIdx];
        console.log(`선택 옵션 선택 - 그룹 ${groupIdx}, 옵션 ${optionIdx}`);
      }
      return newArr;
    });
  };

  const onChangePriceOption = (priceIdx: number) => {
    setSelectedPriceIdx(priceIdx);
    console.log(`가격 옵션 변경 - 인덱스: ${priceIdx}`);
  };

  const handleOrder = () => {
    if (menu.requiredOptions?.some((_, idx) => selectedRequiredOptions[idx] === -1)) {
      alert('필수 옵션을 모두 선택해주세요.');
      return;
    }

    const requiredSelected = menu.requiredOptions?.map((group, gIdx) => ({
      groupName: group.name,
      option: group.options[selectedRequiredOptions[gIdx]],
    })) || [];

    const optionalSelected = menu.optionalOptions?.map((group, gIdx) => ({
      groupName: group.name,
      options: (selectedOptionalOptions[gIdx] || []).map(idx => group.options[idx]),
    })) || [];

    const itemToAdd = {
      storeId,
      storeName,
      menuId: menu.id,
      name: menu.name,
      imageUrl: menu.imageUrl,
      basePrice: selectedPrice.price,
      baseLabel: selectedPrice.label,
      quantity,
      requiredOptions: requiredSelected,
      optionalOptions: optionalSelected,
      totalPrice: total,
    };

    console.log('장바구니에 추가할 아이템:', itemToAdd);

    addItem(storeId, itemToAdd);

    alert('장바구니에 담겼습니다!');

    sessionStorage.setItem('scrollToMenu', 'true');
    router.push(`/store/${storeId}`);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-lg font-bold mb-2">🛒 {menu.name} 주문</h1>

      {menu.imageUrl && (
        <img
          src={menu.imageUrl}
          alt={menu.name}
          className="w-full aspect-video object-cover rounded border mb-4"
        />
      )}

      <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{menu.description}</p>

      {/* 가격 옵션 - 라디오 버튼 리스트 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">가격</label>
        <fieldset className="border rounded p-2 bg-gray-50">
          {menu.prices.map((price, idx) => (
            <label key={idx} className="flex items-center gap-2 text-sm mb-1">
              <input
                type="radio"
                name="price-option"
                checked={selectedPriceIdx === idx}
                onChange={() => onChangePriceOption(idx)}
              />
              <span>{price.label} - {price.price.toLocaleString()}원</span>
            </label>
          ))}
        </fieldset>
      </div>

      {/* 필수 옵션 */}
      {menu.requiredOptions && menu.requiredOptions.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">필수 옵션 선택</label>
          {menu.requiredOptions.map((group, gIdx) => (
            <fieldset key={group.id} className="mb-3 border rounded p-2 bg-gray-50">
              <legend className="font-semibold">
                {group.name}{' '}
                <span className="text-xs text-gray-500">
                  (최소 {group.minSelect}개, 최대 {group.maxSelect}개)
                </span>
              </legend>
              {group.options.map((opt, oIdx) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`required-group-${gIdx}`}
                    checked={selectedRequiredOptions[gIdx] === oIdx}
                    onChange={() => onChangeRequiredOption(gIdx, oIdx)}
                  />
                  <span>{opt.name} (+{opt.price.toLocaleString()}원)</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}

      {/* 선택 옵션 */}
      {menu.optionalOptions && menu.optionalOptions.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">선택 옵션</label>
          {menu.optionalOptions.map((group, gIdx) => (
            <fieldset key={group.id} className="mb-3 border rounded p-2 bg-gray-50">
              <legend className="font-semibold">
                {group.name}{' '}
                <span className="text-xs text-gray-500">
                  (최소 {group.minSelect}개, 최대 {group.maxSelect}개)
                </span>
              </legend>
              {group.options.map((opt, oIdx) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedOptionalOptions[gIdx]?.includes(oIdx) || false}
                    onChange={() => onToggleOptionalOption(gIdx, oIdx)}
                    disabled={
                      selectedOptionalOptions[gIdx]?.length >= group.maxSelect &&
                      !selectedOptionalOptions[gIdx]?.includes(oIdx)
                    }
                  />
                  <span>{opt.name} (+{opt.price.toLocaleString()}원)</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}

      {/* 수량 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">수량</label>
        <div className="flex w-full">
          <button
            type="button"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-12 border rounded-l flex items-center justify-center text-lg select-none"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={quantity}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 1) setQuantity(val);
              else if (e.target.value === '') setQuantity(1);
            }}
            className="flex-grow text-center border-t border-b px-2 py-1"
            style={{ outline: 'none' }}
          />
          <button
            type="button"
            onClick={() => setQuantity(q => q + 1)}
            className="w-12 border rounded-r flex items-center justify-center text-lg select-none"
          >
            +
          </button>
        </div>
      </div>

      {/* 총액 */}
      <div className="mb-6 text-right text-base font-semibold">
        총액: {total.toLocaleString()}원
      </div>

      <button
        onClick={handleOrder}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium"
      >
        장바구니에 담기
      </button>
    </div>
  );
}
