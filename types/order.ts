// types/order.ts
import { Timestamp } from 'firebase/firestore';
import { CartItem } from './cart';

export interface Order {
  id?: string;
  userId: string;       // 주문자 ID
  userPhone?: string,
  userName?: string,
  storeId: string;
  storeName: string;
  orderNumber?: string;
  items: CartItem[];    // CartItem 배열 그대로 사용
  totalPrice: number;   // 총 주문 금액
  status: '주문' | '접수' | '준비' | '픽업' | '취소';
  cancelReason?: string;
  createdAt: Timestamp;
  requestNote?: string;
}
