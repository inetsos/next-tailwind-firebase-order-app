'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useStoreStore } from '@/stores/useStoreStore';
import { Store } from '@/types/store';

export const useInitializeStore = () => {
  const { storeId: rawStoreId } = useParams();
  const router = useRouter();
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

  const { store, setStore } = useStoreStore();

  useEffect(() => {
    if (!storeId) {
      alert('잘못된 접근입니다.');
      router.push('/');
      return;
    }

    if (!store || store.id !== storeId) {
      const fetchStore = async () => {
        const snap = await getDoc(doc(db, 'stores', storeId));
        if (snap.exists()) {
          const fetchedStore = { id: snap.id, ...(snap.data() as Store) };
          setStore(fetchedStore);
        } else {
          alert('존재하지 않는 매장입니다.');
          router.push('/');
        }
      };
      fetchStore();
    }
  }, [storeId, router, setStore, store]);
};
