// app/types/store.ts
export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

export interface BusinessHour {
  opening: string;
  closing: string;
  breakStart?: string;
  breakEnd?: string;
}

export type HolidayFrequency = '매주' | '매월' | '격주' | '매월 1회' | '매월 2회';

export interface HolidayRule {
  frequency: HolidayFrequency;
  days: DayOfWeek[];  // 어떤 요일에 쉬는지
  weeks?: number[];   // 매월 몇째 주 (2회 휴무인 경우 사용)
}

export interface Store {
  id?: string;        // 매장 id
  category: string;   // 카테고리
  industry?: string;  // 업종
  name: string;       // 상호
  description: string;  // 소개
  zipcode: string;    // 우편번호
  address: string;    // 주소
  detailAddress: string;  // 상세주소
  latitude: string;   // 위도
  longitude: string;  // 경도

  // ✅ 요일별 영업시간
  businessHours: Record<DayOfWeek, BusinessHour>;

  // ✅ 휴무 규칙
  holidayRule: HolidayRule;

  admin: string;
  web?: string;
  orderManager?: string;
  status?: string;  // online, offline
}

// distanceKm 포함 확장 타입
export interface StoreWithDistance extends Store {
  distanceKm: number;
}
