'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface CategoryChipsProps {
  categories: Category[];
}

export default function CategoryChips({ categories }: CategoryChipsProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className="relative overflow-x-auto py-2"
      onWheel={(e) => {
        if (e.deltaY !== 0) {
          e.currentTarget.scrollLeft += e.deltaY;
        }
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)} // ← 즉시 사라짐
    >
      {/* 알림 메시지 */}
      {hovering && (
        <div className="absolute inset-x-0 top-0 justify-center z-50 pointer-events-none hidden sm:flex">
          <div className="bg-transparent text-yellow-800 px-0 py-0 text-xs">
            마우스 휠로 좌우 스크롤 할 수 있어요!
          </div>
        </div>
      )}
      
      {/* 카테고리 칩들 */}
      <div className="flex gap-2 whitespace-nowrap px-2 py-1">
        {categories
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((category) => (
            <Link
              key={category.id}
              href={`/categories/${encodeURIComponent(category.name)}/stores`}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-base
                        hover:bg-blue-200 flex-shrink-0 cursor-pointer"
            >
              {category.name}
            </Link>
          ))}
      </div>
    </div>
  );
}
