import StoreList from '@/components/StoreList';

export default function Home() {
  return (
    <div className="w-full px-0 py-6 text-gray-900 dark:text-white">
      <div className="px-2 sm:px-4">
        <h1 className="text-3xl font-bold mb-4">시지 라이프</h1>

        <div className="mb-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            <strong>시지 지역 커뮤니티</strong> - 현재 테스트 배포 중입니다. <br />
            본 사이트는 개발 중이며, 실제 매장과 연동되지 않습니다.
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">🌿 우리 동네의 숨은 보석, 이제 한눈에 만나보세요!</h2>
            <p className="text-gray-700 dark:text-gray-200">
              지역 상점과 주민을 이어주는 <strong>시지 라이프</strong>는 골목길 작은 가게부터 정겨운 단골집까지—  
              당신의 일상 속 가까운 곳에서 특별한 경험을 선물합니다. <br />
              이웃과 함께하는 소비, 그 속에 진짜 가치가 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* StoreList에도 동일한 여백 적용 */}
      <div className="px-2 sm:px-4">
        <StoreList />
      </div>
    </div>
  );
}