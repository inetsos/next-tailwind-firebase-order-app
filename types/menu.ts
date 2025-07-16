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
  prices: MenuPrice[];
  imageUrl: string;
  isSoldOut: boolean;
  requiredOptions: OptionGroup[];
  optionalOptions: OptionGroup[];
  sortOrder: number;
}
