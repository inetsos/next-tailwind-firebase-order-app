import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CartItem } from '@/types/cart';
import { getLocalCart } from './localCart';

export const getCartFromFirestore = async (uid: string) => {
  const ref = doc(db, 'carts', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().carts as Record<string, CartItem[]>) : {};
};

export const saveCartToFirestore = async (uid: string, carts: Record<string, CartItem[]>) => {
  const ref = doc(db, 'carts', uid);
  await setDoc(ref, { carts }, { merge: true });
};

export const mergeLocalCartToFirestore = async (uid: string) => {
  const local = getLocalCart();
  const remote = await getCartFromFirestore(uid);

  const merged: Record<string, CartItem[]> = { ...remote };

  for (const storeId in local) {
    const remoteItems = remote[storeId] || [];
    const localItems = local[storeId];

    const combined = [...remoteItems];

    for (const localItem of localItems) {
      // 같은 메뉴 & 옵션이면 수량 합산 (간단 비교 예)
      const index = combined.findIndex(remoteItem =>
        remoteItem.menuId === localItem.menuId &&
        JSON.stringify(remoteItem.requiredOptions) === JSON.stringify(localItem.requiredOptions) &&
        JSON.stringify(remoteItem.optionalOptions) === JSON.stringify(localItem.optionalOptions)
      );

      if (index >= 0) {
        combined[index].quantity += localItem.quantity;
      } else {
        combined.push(localItem);
      }
    }

    merged[storeId] = combined;
  }

  await saveCartToFirestore(uid, merged);
  return merged;
};

