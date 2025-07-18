'use client';

import { CartItem } from '@/types/cart';

interface CartViewProps {
  cartItems: CartItem[];
  onQuantityChange?: (menuId: string, quantity: number) => void;
  onRemoveItem?: (menuId: string) => void;
}

export default function CartView({
  cartItems,
  onQuantityChange,
  onRemoveItem,
}: CartViewProps) {
  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.totalPrice * item.quantity,
    0
  );

  return (
    <div className="max-w-md mx-auto px-3 py-2 sm:px-4 sm:py-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xl sm:text-2xl font-bold">🛒 장바구니</h4>
        {cartItems.length > 0 && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px] sm:max-w-[180px]">
            매장: <strong>{cartItems[0].storeName}</strong>
          </p>
        )}
      </div>

      {cartItems.length === 0 ? (
        <p className="text-center text-gray-500 mt-10 text-sm sm:text-base">장바구니가 비어 있습니다.</p>
      ) : (
        <div className="space-y-2">
          {cartItems.map((item) => (
            <div
              key={item.menuId}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow mx-0.5 sm:mx-1"
            >
              {/* 이미지 - 후에 필요하면 복원하자.
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )} */}
              <div className="mb-1">
                <p className="text-lg sm:text-base font-semibold text-gray-900 truncate">
                  {item.name}
                  <span className="text-xs sm:text-sm text-gray-500 ml-2">{item.baseLabel}</span>
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm sm:text-base">
                가격: <span className="font-medium">₩{item.basePrice.toLocaleString()}</span>
              </p>

              {/* 옵션 */}
              <div className="space-y-2 mb-3">
                {item.requiredOptions.length > 0 && (
                  <div className="p-2 sm:p-3 bg-white dark:bg-gray-700 rounded border text-xs sm:text-sm">
                    <p className="font-semibold mb-1">✅ 필수 옵션</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-gray-300">
                      {item.requiredOptions.map((opt, i) => (
                        <li key={i} className="truncate">
                          <strong>{opt.groupName}</strong>: {opt.option.name} (+₩{opt.option.price.toLocaleString()})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.optionalOptions.length > 0 && (
                  <div className="p-2 sm:p-3 bg-white dark:bg-gray-700 rounded border text-xs sm:text-sm">
                    <p className="font-semibold mb-1">➕ 선택 옵션</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-gray-300">
                      {item.optionalOptions.map((opt, i) => (
                        <li key={i} className="truncate">
                          <strong>{opt.groupName}</strong>:{" "}
                          {opt.options.length > 0
                            ? opt.options.map(o => `${o.name} (+₩${o.price.toLocaleString()})`).join(', ')
                            : "선택 안함"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 수량 조절 + 삭제 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <label htmlFor={`qty-${item.menuId}`} className="text-xs sm:text-sm select-none">
                    수량
                  </label>

                  <button
                    type="button"
                    onClick={() => onQuantityChange?.(item.menuId, Math.max(1, item.quantity - 1))}
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-md flex items-center 
                              justify-center text-lg select-none hover:bg-blue-700 transition"
                    aria-label="수량 감소"
                  >
                    −
                  </button>

                  <input
                    id={`qty-${item.menuId}`}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        onQuantityChange?.(item.menuId, val);
                      }
                    }}
                    className="w-12 sm:w-14 h-7 sm:h-8 border rounded-md px-1 sm:px-2 py-0 text-center text-xs sm:text-sm outline-none"
                    style={{ lineHeight: '28px' }}
                  />

                  <button
                    type="button"
                    onClick={() => onQuantityChange?.(item.menuId, item.quantity + 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-md flex items-center 
                              justify-center text-lg select-none hover:bg-blue-700 transition"
                    aria-label="수량 증가"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem?.(item.menuId)}
                  type="button"
                  className="text-red-600 hover:underline text-xs sm:text-sm"
                >
                  삭제
                </button>
              </div>

              {/* 총액 */}
              <p className="mt-3 text-right font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                총액: {(item.totalPrice * item.quantity).toLocaleString()} 원
              </p>
            </div>
          ))}

          <div className="text-right text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            총합계: {totalAmount.toLocaleString()} 원
          </div>
        </div>
      )}
    </div>
  );
}
