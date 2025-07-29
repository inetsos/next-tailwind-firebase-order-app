// CategoryChips.tsx
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
  return (
    <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>

    <div className="flex gap-2 whitespace-nowrap px-2 py-1" style={{
      msOverflowStyle: 'none',
    }}>
      {categories.map(category => (
        <Link
          key={category.id}
          href={`/categories/${encodeURIComponent(category.name)}/stores`}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-base hover:bg-blue-200 flex-shrink-0"
        >
          {category.name}
        </Link>
      ))}
    </div>
  </div>

  );
}
