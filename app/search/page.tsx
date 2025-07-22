// app/search/page.tsx
import { Suspense } from 'react';
import SearchResults from './SearchResults';

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center">로딩 중...</p>}>
      <SearchResults />
    </Suspense>
  );
}
