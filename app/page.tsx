// app/page.tsx
import StoreList from '@/components/StoreList';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Store } from '@/types/store';
import { convertFirestoreTimestamp } from '@/utils/firestoreUtils';
import CategoryChips from '@/components/CategoryChips';

export default async function Home() {
  const snapshot = await getDocs(
    query(collection(db, 'stores'), orderBy('createdAt', 'desc'))
  );

  const stores: Store[] = snapshot.docs.map(doc =>
    convertFirestoreTimestamp({ id: doc.id, ...(doc.data() as Omit<Store, 'id'>) })
  );

  // ✅ 카테고리 불러오기 (타입 일치시키기)
  const categorySnap = await getDocs(query(collection(db, 'store-categories'), orderBy('sortOrder')));
  const categories = categorySnap.docs.map(doc => {
    const data = doc.data() as { name: string; sortOrder: number };
    return {
      id: doc.id,
      name: data.name,
      sortOrder: data.sortOrder,
    };
  });

  return (
    <div className="w-full px-0 py-4 text-gray-900 dark:text-white">
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

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 text-center">
            <p>
              <strong>시지 라이프</strong> 각종 문의는{' '}
              <a
                href="https://open.kakao.com/o/gW3rCVHh"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:text-yellow-600 dark:hover:text-yellow-400"
              >
                카카오톡 오픈채팅
              </a>
              &nbsp;에서 해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* ✅ 카테고리 칩 리스트 삽입 */}
      <div className="my-4">
        <CategoryChips categories={categories} />
      </div>

      {/* 매장 리스트 (임시 주석처리) */}
      {/* <div className="px-2 sm:px-4">
        <StoreList stores={stores} />
      </div> */}
    </div>
  );
}
