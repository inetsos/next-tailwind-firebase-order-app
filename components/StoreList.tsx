'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Store } from '@/types/store';
import Link from 'next/link';
import { useUserLocation, getDistanceFromLatLonInKm } from '@/hooks/useUserLocation'; // 경로 맞게 수정

interface StoreWithDistance extends Store {
  distanceKm?: number;
}

export default function StoreList() {
  const [stores, setStores] = useState<StoreWithDistance[]>([]);
  const [loading, setLoading] = useState(true);

  // 커스텀 훅 사용
  const { location, error: locationError } = useUserLocation();

  useEffect(() => {
    async function fetchStores() {
      try {
        const q = query(collection(db, 'stores'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        let data: StoreWithDistance[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Store, 'id'>),
        }));

        if (location) {
          data = data.map(store => {
            if (typeof store.latitude === 'number' && typeof store.longitude === 'number') {
              return {
                ...store,
                distanceKm: getDistanceFromLatLonInKm(
                  location.lat,
                  location.lng,
                  store.latitude,
                  store.longitude
                ),
              };
            }
            return store;
          });
          data.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
        }

        setStores(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, [location]);

  if (loading) return <p className="p-4 text-center">로딩 중...</p>;
  if (stores.length === 0) return <p className="p-4 text-center">등록된 매장이 없습니다.</p>;

  return (
    <div className="mt-6">
      {locationError && (
        <p className="p-2 text-red-600 text-center">{locationError}</p>
      )}
      <ul className="space-y-4">
        {stores.map(store => (
          <li key={store.id}>
            <Link
              href={`/store/${store.id}`}
              className="block p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                <h4 className="text-lg font-semibold text-gray-900">{store.name}</h4>
                <p className="text-sm text-gray-500 mt-1 sm:mt-0">{store.category}</p>
              </div>

              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                {store.description}
              </p>

              {store.distanceKm !== undefined && (
                <p className="text-sm text-blue-600 mt-2">
                  거리: {store.distanceKm < 1
                    ? `${Math.round(store.distanceKm * 1000)} m`
                    : `${store.distanceKm.toFixed(1)} km`}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

}
