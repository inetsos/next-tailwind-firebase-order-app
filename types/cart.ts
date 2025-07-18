// types/cart.ts

export interface OptionItem {
  name: string;
  price: number;
}

export interface CartItem {
  id?: string; // 고유 식별자 (선택)
  storeId: string; // 매장 ID
  storeName: string; // 매장 이름
  menuId: string; // 메뉴 ID
  name: string; // 메뉴 이름
  imageUrl?: string; // 메뉴 이미지
  baseLabel: string; // 사이즈/기본 가격 라벨
  basePrice: number; // 기본 가격
  quantity: number; // 수량
  totalPrice: number; // 총 가격 (옵션 포함)

  requiredOptions: {
    groupName: string; // 필수 옵션 그룹명
    option: OptionItem; // 선택한 옵션
  }[];

  optionalOptions: {
    groupName: string; // 선택 옵션 그룹명
    options: OptionItem[]; // 선택한 옵션 배열
  }[];
}
