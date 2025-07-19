'use client';

import { useEffect, useState } from 'react';
import type { Store } from '@/types/store';
import Link from 'next/link';
import { useUserLocation, getDistanceFromLatLonInKm } from '@/hooks/useUserLocation';

// Store 타입 확장: 거리 정보 포함
export interface StoreWithDistance extends Store {
  distanceKm?: number;
}

// 타입 가드 함수 — StoreWithDistance 여부 체크
function hasDistanceKm(store: Store | StoreWithDistance): store is StoreWithDistance {
  return 'distanceKm' in store && typeof store.distanceKm === 'number';
}

interface StoreListProps {
  stores: Store[];
}

export default function StoreList({ stores: initialStores }: StoreListProps) {
  // 초기 상태를 StoreWithDistance 배열로 변환 (distanceKm는 아직 없음)
  const [stores, setStores] = useState<StoreWithDistance[]>(initialStores);

  const { location, error: locationError } = useUserLocation();

  useEffect(() => {
    if (!location) return;

    const updated: StoreWithDistance[] = initialStores.map(store => {
      const lat = typeof store.latitude === 'string' ? parseFloat(store.latitude) : store.latitude;
      const lng = typeof store.longitude === 'string' ? parseFloat(store.longitude) : store.longitude;

      if (
        typeof lat === 'number' &&
        !isNaN(lat) &&
        typeof lng === 'number' &&
        !isNaN(lng)
      ) {
        return {
          ...store,
          distanceKm: getDistanceFromLatLonInKm(location.lat, location.lng, lat, lng),
        };
      }
      return store;
    });

    updated.sort((a, b) => {
        const distA = a.distanceKm ?? 99999;
        const distB = b.distanceKm ?? 99999;
        return distA - distB;
      });

    setStores(updated);
  }, [location, initialStores]);

  if (stores.length === 0)
    return <p className="p-4 text-center">등록된 매장이 없습니다.</p>;

  return (
    <div className="mt-6">
      {locationError && (
        <p className="p-2 text-red-600 dark:text-red-400 text-center">{locationError}</p>
      )}
      <ul className="space-y-4">
        {stores.map(store => (
          <li key={store.id}>
            <Link
              href={`/store/${store.id}`}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                <h4 className="text-lg font-semibold">{store.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                  {store.category}
                </p>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                {store.description}
              </p>

              {hasDistanceKm(store) && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  거리:{' '}
                  {store.distanceKm! < 1
                    ? `${Math.round(store.distanceKm! * 1000)} m`
                    : `${store.distanceKm!.toFixed(1)} km`}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
