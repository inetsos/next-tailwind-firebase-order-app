import StoreList from '@/components/StoreList';

export default function StoreListPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">전체 매장 목록</h1>
      <StoreList />
    </div>
  );
}
