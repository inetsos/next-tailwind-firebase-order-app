import { db } from '@/firebase/firebaseConfig';
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Order } from '@/types/order';

export const createOrderWithTransaction = async (
  order: Omit<Order, 'id' | 'createdAt' | 'orderNumber'>
) => {
  const storeOrderCounterRef = doc(db, 'stores', order.storeId);
  const ordersRef = collection(db, 'stores', order.storeId, 'orders');
  const userOrdersRef = collection(db, 'users', order.userId, 'orders');

  return await runTransaction(db, async (transaction) => {
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

    transaction.set(storeOrderCounterRef, { date: todayStr, seq }, { merge: true });

    const orderNumber = `${todayStr}-${String(seq).padStart(6, '0')}`;
    const newOrderRef = doc(ordersRef);

    // 주문 문서 저장
    transaction.set(newOrderRef, {
      ...order,
      orderNumber,
      createdAt: serverTimestamp(),
    });

    // 회원 주문 기록 저장
    transaction.set(doc(userOrdersRef, newOrderRef.id), {
      storeId: order.storeId,
      storeName: order.storeName,
      orderedAt: serverTimestamp(),
    });

    // 메시지 저장 - 트랜잭션 내에서 setDoc으로 처리
    const messageRef = doc(db, 'users', order.userId, 'orderMessages', crypto.randomUUID());
    transaction.set(messageRef, {
      orderNumber,
      storeId: order.storeId,
      storeName: order.storeName,
      status: '접수',
      message: `${order.storeName} - 주문이 접수되었습니다.`,
      createdAt: serverTimestamp(),
      read: false,
    });

    return { id: newOrderRef.id, orderNumber };
  });
};
