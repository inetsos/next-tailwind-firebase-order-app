// types/menu.ts

export interface MenuPrice {
  label: string;     // 예: "레귤러", "라지"
  price: number;
}

export interface OptionItem {
  id: string;
  name: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: OptionItem[];
}

export interface Menu {
  id: string;
  name: string;
  description: string;
  category: string;

  // 단일 가격 또는 다중 가격 중 하나만 사용
  price?: number;             // 단일 가격 메뉴일 경우 사용
  prices?: MenuPrice[];       // 여러 가격 (label 포함)일 경우 사용

  imageUrl: string;
  isSoldOut: boolean;
  requiredOptions: OptionGroup[];
  optionalOptions: OptionGroup[];
  sortOrder: number;
}
