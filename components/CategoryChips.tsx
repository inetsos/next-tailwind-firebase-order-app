// CategoryChips.tsx 예시
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
    <div className="flex flex-wrap gap-2">
      {categories.map(category => (
        <Link
          key={category.id}
          href={`/categories/${encodeURIComponent(category.name)}/stores`}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-base hover:bg-blue-200"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
