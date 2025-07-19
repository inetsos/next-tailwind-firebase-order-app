import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CartItem } from '@/types/cart';

export interface OrderData {
  userId?: string;         
  storeId: string;
  items: CartItem[];
  requestNote?: string;
  totalPrice: number;
  createdAt: any;
}

// 매장별 하위 컬렉션에 주문 저장
export async function saveOrderToFirestore(order: Omit<OrderData, 'createdAt'>) {
  const storeOrdersRef = collection(db, 'stores', order.storeId, 'orders');
  const docRef = await addDoc(storeOrdersRef, {
    ...order,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
