import StoreList from '@/components/StoreList';

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-2">시지 라이프</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        시지 지역 커뮤니티 - 테스트 배포 중입니다.
      </p>
      <StoreList />
    </div>
  );
}
