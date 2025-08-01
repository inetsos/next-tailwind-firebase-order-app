'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FoodAlley {
  id: string;
  name: string;
  sortOrder: number;
}

interface Props {
  foodAlleys: FoodAlley[];
}

export default function FoodAlleyChips({ foodAlleys }: Props) {
  const router = useRouter();
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className="relative overflow-x-auto py-2"
      style={{ scrollbarWidth: 'none' }}
      onWheel={(e) => {
        if (e.deltaY !== 0) {
          e.currentTarget.scrollLeft += e.deltaY;
        }
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {hovering && (
        <div className="absolute inset-x-0 top-0 justify-center pointer-events-none z-50  hidden sm:flex">
          <div className="bg-transparent text-yellow-800 px-0 py-0 text-xs">
            마우스 휠로 좌우 스크롤 할 수 있어요!
          </div>
        </div>
      )}

      <div
        className="flex gap-2 whitespace-nowrap px-2"
        style={{ msOverflowStyle: 'none' }}
      >
        {foodAlleys
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((alley) => {
            const url = `/food-alleys/${alley.id}?name=${encodeURIComponent(alley.name)}`;
            return (
              <button
                key={alley.id}
                onClick={() => router.push(url)}
                className="px-4 py-2 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 
                          text-base hover:bg-green-200 dark:hover:bg-green-700 cursor-pointer"
              >
                {alley.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}
