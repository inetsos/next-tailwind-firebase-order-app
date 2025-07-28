'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchForm() {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    router.push(`/search?query=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6 items-center">
      <input
        type="text"
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
        placeholder="시지 지역 상호로 검색하세요."
        className="flex-1 border p-2 rounded"
      />
      <button
        type="submit"
        aria-label="검색"
        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
}
