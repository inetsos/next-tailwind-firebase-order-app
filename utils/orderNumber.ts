import { db } from '@/firebase/firebaseConfig';
import { doc, runTransaction } from 'firebase/firestore';

export async function generateOrderNumber(storeId: string): Promise<string> {
  const counterRef = doc(db, 'stores', storeId, 'counters', 'orderCounter');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}${mm}${dd}`;

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let seq = 1;

    if (counterDoc.exists()) {
      const data = counterDoc.data();
      if (data.date === todayStr) {
        seq = data.seq + 1;
      }
    }

    transaction.set(counterRef, {
      date: todayStr,
      seq,
    }, { merge: true });

    return `${todayStr}-${String(seq).padStart(6, '0')}`;
  });
}
