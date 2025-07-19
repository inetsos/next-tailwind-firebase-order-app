import { db } from '@/firebase/firebaseConfig';
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Order } from '@/types/order';

export const createOrderWithTransaction = async (order: Omit<Order, 'id' | 'createdAt' | 'orderNumber'>) => {
  const storeOrderCounterRef = doc(db, 'stores', order.storeId);

  const ordersRef = collection(db, 'stores', order.storeId, 'orders');

  return await runTransaction(db, async (transaction) => {
    // 1. 현재 카운터 문서 읽기
    const counterDoc = await transaction.get(storeOrderCounterRef);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}${mm}${dd}`;

    let seq = 1;
    if (counterDoc.exists()) {
      const data = counterDoc.data();
      if (data.date === todayStr) {
        seq = data.seq + 1;
      }
    }

    // 2. 카운터 문서 업데이트
    transaction.set(storeOrderCounterRef, { date: todayStr, seq }, { merge: true });

    // 3. 주문번호 생성
    const orderNumber = `${todayStr}-${String(seq).padStart(6, '0')}`;

    // 4. 주문 문서 생성
    const newOrderRef = doc(ordersRef);
    transaction.set(newOrderRef, {
      ...order,
      orderNumber,
      createdAt: serverTimestamp(),
    });

    // 5. 주문 ID와 주문번호 리턴
    return { id: newOrderRef.id, orderNumber };
  });
};
