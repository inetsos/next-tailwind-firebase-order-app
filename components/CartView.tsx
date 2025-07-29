'use client';

import { CartItem } from '@/types/cart';
import dayjs from 'dayjs';

interface CartViewProps {
  cartItems: CartItem[];
  editable?: boolean;
  onQuantityChange?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

export default function CartView({
  cartItems,
  editable = true,
  onQuantityChange,
  onRemoveItem,
}: CartViewProps) {
  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.totalPrice,
    0
  );

  return (
    <div className="max-w-md mx-auto px-2 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl sm:text-2xl font-bold">🛒 장바구니</h4>
        {cartItems.length > 0 && (
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
            매장: <strong>{cartItems[0].storeName}</strong>
          </p>
        )}
      </div>

      {cartItems.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-10 text-base sm:text-lg">
          장바구니가 비어 있습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {cartItems.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              editable={editable}
              onQuantityChange={onQuantityChange}
              onRemoveItem={onRemoveItem}
            />
          ))}
          <div className="text-right text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            총합계: {totalAmount.toLocaleString()} 원
          </div>
        </div>
      )}
    </div>
  );
}

interface CartItemCardProps {
  item: CartItem;
  editable: boolean;
  onQuantityChange?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

function CartItemCard({
  item,
  editable,
  onQuantityChange,
  onRemoveItem,
}: CartItemCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 shadow-md">
      <div className="mb-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          담은 시간: {dayjs(item.addedAt).format('YYYY-MM-DD HH:mm')}
        </p>
        <p className="text-xl sm:text-lg font-semibold truncate">
          {item.name}
          <span className="text-sm sm:text-base text-gray-500 ml-2">{item.baseLabel}</span>
        </p>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">
        가격: <span className="font-medium">{item.basePrice.toLocaleString()} 원</span>
      </p>

      <OptionBlock title="✅ 필수 옵션" options={item.requiredOptions} />
      <OptionBlock title="➕ 선택 옵션" options={item.optionalOptions} optional />

      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
        {editable ? (
          <>
            <QuantityControl
              itemId={item.id}
              quantity={item.quantity}
              onChange={onQuantityChange}
            />
            <button
              onClick={() => onRemoveItem?.(item.id)}
              className="text-red-600 hover:underline text-sm sm:text-base"
            >
              삭제
            </button>
          </>
        ) : (
          <span className="text-base sm:text-lg text-gray-700">수량: {item.quantity}</span>
        )}
      </div>

      <p className="mt-3 text-right font-semibold text-base sm:text-lg truncate">
        총액: {(item.totalPrice).toLocaleString()} 원
      </p>
    </div>
  );
}

function QuantityControl({
  itemId,
  quantity,
  onChange,
}: {
  itemId: string;
  quantity: number;
  onChange?: (itemId: string, quantity: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`qty-${itemId}`} className="text-sm sm:text-base select-none">
        수량
      </label>
      <button
        type="button"
        onClick={() => onChange?.(itemId, Math.max(1, quantity - 1))}
        className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        aria-label="수량 감소"
      >
        −
      </button>
      <input
        id={`qty-${itemId}`}
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val) && val > 0) onChange?.(itemId, val);
        }}
        className="w-12 sm:w-14 h-7 sm:h-8 border rounded-md px-2 text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
      <button
        type="button"
        onClick={() => onChange?.(itemId, quantity + 1)}
        className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        aria-label="수량 증가"
      >
        +
      </button>
    </div>
  );
}

function OptionBlock({
  title,
  options,
  optional = false,
}: {
  title: string;
  options: any[];
  optional?: boolean;
}) {
  if (optional && options.length === 0) return null;

  return (
    <div className="p-2 mt-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-sm sm:text-base">
      <p className="font-semibold mb-1">{title}</p>
      <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-gray-300">
        {optional
          ? options.map((opt, i) => (
              <li key={i}>
                <strong>{opt.groupName}</strong>:&nbsp;
                {opt.options.length > 0
                  ? opt.options
                      .map((o: any) => `${o.name} (+₩${o.price.toLocaleString()})`)
                      .join(', ')
                  : '선택 안함'}
              </li>
            ))
          : options.map((opt, i) => (
              <li key={i}>
                <strong>{opt.groupName}</strong>: {opt.option.name} (+₩
                {opt.option.price.toLocaleString()})
              </li>
            ))}
      </ul>
    </div>
  );
}
