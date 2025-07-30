'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Menu, OptionGroup } from '@/types/menu';
import { useCart } from '@/context/CartContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { useStoreStore } from '@/stores/useStoreStore'; // 전역 store 상태 가져오기
import { DayOfWeek } from '@/types/store';

export default function OnlineOrderPage() {
  const params = useParams();
  const router = useRouter();

  const rawStoreId = params.storeId;
  const rawMenuId = params.menuId;
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;
  const menuId = Array.isArray(rawMenuId) ? rawMenuId[0] : rawMenuId;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPriceIdx, setSelectedPriceIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedRequiredOptions, setSelectedRequiredOptions] = useState<number[]>([]);
  const [selectedOptionalOptions, setSelectedOptionalOptions] = useState<number[][]>([]);

  const { addItem } = useCart();
  const store = useStoreStore(state => state.store); // 전역 store 정보 가져오기

  const [isOpen, setIsOpen] = useState(false);

  // 현재 store 영업시간 및 휴무일 체크 함수
  const checkIsOpen = () => {
    if (!store?.businessHours || !store?.holidayRule) return false;

    const days: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];
    const today = new Date();
    const dayLabel = days[today.getDay()];
    const hour = store.businessHours[dayLabel];
    if (!hour || !hour.opening || !hour.closing) return false;

    // ⏰ 시간 체크
    const now = new Date();
    const [openH, openM] = hour.opening.split(':').map(Number);
    const [closeH, closeM] = hour.closing.split(':').map(Number);

    const openTime = new Date(now);
    openTime.setHours(openH, openM, 0, 0);
    const closeTime = new Date(now);
    closeTime.setHours(closeH, closeM, 0, 0);

    const isWithinBusinessHours = now >= openTime && now < closeTime;

    // 🛑 휴무일 체크
    const { frequency, days: offDays, weeks } = store.holidayRule;

    const isTodayOffDay = offDays.includes(dayLabel);

    const currentDate = today.getDate();
    const currentWeek = Math.floor((currentDate - 1) / 7) + 1;

    let isHoliday = false;

    if (frequency === '매주') {
      isHoliday = isTodayOffDay;
    } else if (frequency === '격주') {
      isHoliday = isTodayOffDay && currentWeek % 2 === 0;
    } else if (frequency === '매월') {
      isHoliday = isTodayOffDay;
    } else if (frequency === '매월 1회') {
      isHoliday = isTodayOffDay && Array.isArray(weeks) && weeks.includes(1);
    } else if (frequency === '매월 2회') {
      isHoliday = isTodayOffDay && Array.isArray(weeks) && weeks.includes(currentWeek);
    }
    return isWithinBusinessHours && !isHoliday;
  };

  useEffect(() => {
    setIsOpen(checkIsOpen());
  }, [store]);

  // storeName은 store에서 바로 가져오기
  const storeName = store?.name || '';

  useEffect(() => {
    const fetchMenu = async () => {
      if (!storeId || !menuId) return;
      setLoading(true);
      const menuRef = doc(db, 'stores', storeId, 'menus', menuId);
      const snap = await getDoc(menuRef);
      if (snap.exists()) {
        const data = snap.data();
        setMenu({ id: snap.id, ...data } as Menu);

        if (data.requiredOptions?.length > 0) {
          setSelectedRequiredOptions(
            data.requiredOptions.map((group: OptionGroup) =>
              group.options.length > 0 ? 0 : -1
            )
          );
        } else {
          setSelectedRequiredOptions([]);
        }

        if (data.optionalOptions?.length > 0) {
          setSelectedOptionalOptions(data.optionalOptions.map(() => []));
        } else {
          setSelectedOptionalOptions([]);
        }
      }
      setLoading(false);
    };
    fetchMenu();
  }, [storeId, menuId]);

  if (!storeId || !menuId)
    return <p className="p-4 text-center text-sm">잘못된 접근입니다.</p>;
  if (loading) return <p className="p-4 text-center text-sm">⏳ 로딩 중...</p>;
  if (!menu) return <p className="p-4 text-center text-sm">❌ 메뉴 정보를 불러올 수 없습니다.</p>;

  const selectedPrice =
    menu.prices && menu.prices.length > 0
      ? menu.prices[selectedPriceIdx]
      : { label: '기본', price: menu.price ?? 0 };

  const requiredOptionsPrice = selectedRequiredOptions.reduce(
    (sum, optionIdx, groupIdx) => {
      const group = menu.requiredOptions?.[groupIdx];
      if (!group || optionIdx === -1) return sum;
      return sum + (group.options[optionIdx]?.price || 0);
    },
    0
  );

  const optionalOptionsPrice = selectedOptionalOptions.reduce(
    (sum, optionIndexes, groupIdx) => {
      const group = menu.optionalOptions?.[groupIdx];
      if (!group) return sum;
      const groupSum = optionIndexes.reduce((groupSum, optionIdx) => {
        return groupSum + (group.options[optionIdx]?.price || 0);
      }, 0);
      return sum + groupSum;
    },
    0
  );

  const total = (selectedPrice.price + requiredOptionsPrice + optionalOptionsPrice) * quantity;

  const onChangeRequiredOption = (groupIdx: number, optionIdx: number) => {
    setSelectedRequiredOptions(prev => {
      const newArr = [...prev];
      newArr[groupIdx] = optionIdx;
      return newArr;
    });
  };

  const onToggleOptionalOption = (groupIdx: number, optionIdx: number) => {
    setSelectedOptionalOptions(prev => {
      const newArr = [...prev];
      const groupSelected = newArr[groupIdx] || [];
      if (groupSelected.includes(optionIdx)) {
        newArr[groupIdx] = groupSelected.filter(idx => idx !== optionIdx);
      } else {
        const group = menu.optionalOptions?.[groupIdx];
        if (group && groupSelected.length >= group.maxSelect) {
          alert(`선택 옵션은 최대 ${group.maxSelect}개까지 선택 가능합니다.`);
          return prev;
        }
        newArr[groupIdx] = [...groupSelected, optionIdx];
      }
      return newArr;
    });
  };

  const onChangePriceOption = (priceIdx: number) => {
    setSelectedPriceIdx(priceIdx);
  };

  const handleOrder = async () => {
    if (!isOpen) {
      alert('현재 영업 시간이 아닙니다. 주문이 불가능합니다.');
      return;
    }
    if (menu.requiredOptions?.some((_, idx) => selectedRequiredOptions[idx] === -1)) {
      alert('필수 옵션을 모두 선택해주세요.');
      return;
    }

    const requiredSelected =
      menu.requiredOptions?.map((group, gIdx) => ({
        groupName: group.name,
        option: group.options[selectedRequiredOptions[gIdx]],
      })) || [];

    const optionalSelected =
      menu.optionalOptions?.map((group, gIdx) => ({
        groupName: group.name,
        options: (selectedOptionalOptions[gIdx] || []).map(idx => group.options[idx]),
      })) || [];

    const itemToAdd = {
      id: uuidv4(),
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
      addedAt: Date.now(),
    };

    addItem(storeId, itemToAdd);
    sessionStorage.setItem('scrollToMenu', 'true');

    router.push(`/store/${storeId}`);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <Head>
        <title>{menu.name} 주문 - {storeName}</title>
      </Head>

      <div className="flex items-center justify-between mb-4 mt-2">
        <h4 className="text-lg font-bold">🛒 {menu.name} 주문</h4>
        <button
          onClick={() => router.push(`/store/${storeId}`)}
          className="flex items-center text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> 돌아가기
        </button>
      </div>

      {menu.imageUrl && (
        <img
          src={menu.imageUrl}
          alt={menu.name}
          className="w-full aspect-video object-cover rounded border mb-4 border-gray-300 dark:border-gray-700"
        />
      )}

      <p className="text-sm mb-4 whitespace-pre-line text-gray-700 dark:text-gray-300">{menu.description}</p>

      {/* 가격 옵션 */}
      {menu.prices && menu.prices.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">가격</label>
          <fieldset className="border rounded p-3 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
            {menu.prices.map((price, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm mb-2 cursor-pointer">
                <input
                  type="radio"
                  name="price-option"
                  checked={selectedPriceIdx === idx}
                  onChange={() => onChangePriceOption(idx)}
                  className="cursor-pointer"
                />
                <span>{price.label} - {price.price.toLocaleString()}원</span>
              </label>
            ))}
          </fieldset>
        </div>
      )}

      {/* 필수 옵션 */}
      {menu.requiredOptions && menu.requiredOptions.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">필수 옵션 선택</label>
          {menu.requiredOptions.map((group, gIdx) => (
            <fieldset
              key={group.id}
              className="mb-4 border rounded p-3 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              <legend className="font-semibold mb-2">
                {group.name}{' '}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (최소 {group.minSelect}개, 최대 {group.maxSelect}개)
                </span>
              </legend>
              {group.options.map((opt, oIdx) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 text-sm mb-1 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`required-group-${gIdx}`}
                    checked={selectedRequiredOptions[gIdx] === oIdx}
                    onChange={() => onChangeRequiredOption(gIdx, oIdx)}
                    className="cursor-pointer"
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
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">선택 옵션</label>
          {menu.optionalOptions.map((group, gIdx) => (
            <fieldset
              key={group.id}
              className="mb-4 border rounded p-3 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              <legend className="font-semibold mb-2">
                {group.name}{' '}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (최소 {group.minSelect}개, 최대 {group.maxSelect}개)
                </span>
              </legend>
              {group.options.map((opt, oIdx) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 text-sm mb-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedOptionalOptions[gIdx]?.includes(oIdx) || false}
                    onChange={() => onToggleOptionalOption(gIdx, oIdx)}
                    disabled={
                      selectedOptionalOptions[gIdx]?.length >= group.maxSelect &&
                      !selectedOptionalOptions[gIdx]?.includes(oIdx)
                    }
                    className="cursor-pointer"
                  />
                  <span>{opt.name} (+{opt.price.toLocaleString()}원)</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}

      {/* 수량 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">수량</label>
        <div className="flex w-full">
          <button
            type="button"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-12 border rounded-l flex items-center justify-center text-lg select-none border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
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
            className="flex-grow text-center border-t border-b px-2 py-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            style={{ outline: 'none' }}
          />
          <button
            type="button"
            onClick={() => setQuantity(q => q + 1)}
            className="w-12 border rounded-r flex items-center justify-center text-lg select-none border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            +
          </button>
        </div>
      </div>

      {/* 총액 */}
      <div className="mb-6 text-right text-base font-semibold">
        총액: {total.toLocaleString()}원
      </div>

      {/* 영업시간 안내 */}
      {!isOpen && (
        <p className="mb-4 text-red-600 font-semibold text-center">
          현재 영업 시간이 아닙니다. 주문이 불가능합니다.
        </p>
      )}

      {/* 주문 버튼 */}
      <button
        onClick={handleOrder}
        disabled={!isOpen}
        className={`w-full py-2 rounded text-sm font-medium text-white ${
          isOpen ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        장바구니에 담기
      </button>
    </div>
  );
}
