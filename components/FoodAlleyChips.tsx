'use client';

import { useRouter } from 'next/navigation';

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

  return (
    <div className="flex flex-wrap gap-2">
      {foodAlleys.map(alley => {
        const encodedName = encodeURIComponent(alley.name);
        const url = `/food-alleys/${alley.id}?name=${encodeURIComponent(alley.name)}`;

        return (
          <button
            key={alley.id}
            onClick={() => router.push(url)}
            className="px-4 py-2 rounded-full bg-green-100 dark:bg-green-800
                      text-green-800 dark:text-green-100 text-base hover:bg-green-200 dark:hover:bg-green-700"
          >
            {alley.name}
          </button>
        );
      })}
    </div>
  );
}
