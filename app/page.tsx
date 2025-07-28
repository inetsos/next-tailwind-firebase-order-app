import StoreList from '@/components/StoreList';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Store } from '@/types/store';
import { convertFirestoreTimestamp } from '@/utils/firestoreUtils';
import CategoryChips from '@/components/CategoryChips';
import SearchForm from '@/components/SearchForm';
import FoodAlleyChips from '@/components/FoodAlleyChips'; // ✅ 추가

export default async function Home() {
  const snapshot = await getDocs(
    query(collection(db, 'stores'), orderBy('createdAt', 'desc'))
  );

  const stores: Store[] = snapshot.docs.map(doc =>
    convertFirestoreTimestamp({ id: doc.id, ...(doc.data() as Omit<Store, 'id'>) })
  );

  // ✅ 카테고리 불러오기
  const categorySnap = await getDocs(query(collection(db, 'store-categories'), orderBy('sortOrder')));
  const categories = categorySnap.docs.map(doc => {
    const data = doc.data() as { name: string; sortOrder: number };
    return {
      id: doc.id,
      name: data.name,
      sortOrder: data.sortOrder,
    };
  });

  // ✅ 먹자 골목 불러오기
  const alleySnap = await getDocs(query(collection(db, 'foodAlleys'), orderBy('sortOrder')));
  const foodAlleys = alleySnap.docs.map(doc => {
    const data = doc.data() as { name: string; sortOrder: number };
    //console.log(data);
    return {
      id: doc.id,
      name: data.name,
      sortOrder: data.sortOrder,
    };
  });

  return (
    <div className="w-full px-0 py-4 text-gray-900 dark:text-white">
      <div className="px-2 sm:px-4">
        <h4 className="text-2xl font-bold mt-12 mb-6 text-center">시지 라이프</h4>

        <div className="space-y-4">
          
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg ">
              골목길 작은 가게부터 정겨운 단골집까지—<br/>
              이웃과 함께하는 소비, 소중한 가치입니다.          
          </div>

          <div className="my-8">
            <SearchForm />
          </div>

          {/* ✅ 카테고리 칩 리스트 */}
          <div className="my-4">
            <CategoryChips categories={categories} />
          </div>

          {/* ✅ 먹자 골목 칩 리스트 */}
          <div className="my-4">
            <FoodAlleyChips foodAlleys={foodAlleys} />
          </div>

          <p className='mt-16'>
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

          <p className="text-gray-600 dark:text-gray-300">
            본 사이트는 <strong>테스트 중</strong>이며, 실제 매장과 연동되지 않습니다.
          </p>
        </div>
      </div>

    </div>
  );
}
