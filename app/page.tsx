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
        <h1 className="text-3xl font-bold mb-4">시지 라이프</h1>

        <div className="mb-6 space-y-4">
          <div className='text-center'>
            <p className="text-gray-600 dark:text-gray-300">
              본 사이트는 <strong>개발 중</strong>이며, <br />
              실제 매장과 연동되지 않습니다.(테스트 배포 중)
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <strong className="text-lg">🌿 우리 동네의 숨은 보석, 만나보세요!</strong>
            <p className="mt-4 text-gray-700 dark:text-gray-200">
              지역 상점과 주민을 이어주는 <strong>시지 라이프</strong>는 골목길 작은 가게부터 정겨운 단골집까지—  
              당신의 일상 속 가까운 곳에서 특별한 경험을 선물합니다. <br />
              이웃과 함께하는 소비, 그 속에 진짜 가치가 있습니다.
            </p>            
          </div>

          <div className="my-6">
            <SearchForm />
          </div>

          {/* ✅ 카테고리 칩 리스트 */}
          <div className="my-6">
            <CategoryChips categories={categories} />
          </div>

          {/* ✅ 먹자 골목 칩 리스트 */}
          <div className="my-6">
            <FoodAlleyChips foodAlleys={foodAlleys} />
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

      <div className="my-2 p-4">
        <h6 className="text-xl font-bold mb-6">📍 대구광역시 수성구 시지 지역은?</h6>

        <p className="text-lg leading-relaxed mb-4">
          맑은 공기와 여유로운 분위기가 흐르는 <strong>시지 지역</strong>은
          신매동, 욱수동, 사월동, 매호동, 노변동, 시지동 일대를 포괄합니다.
        </p>

        <p className="text-lg leading-relaxed mb-4">
          넓은 녹지와 생활 인프라가 잘 조화를 이루며,
          커피 향이 퍼지는 골목, 아이들 웃음소리가 들리는 공원,
          그리고 도심 속 작은 쉼표 같은 공간들이 가득한 이곳은
          주거와 문화, 교육까지 모두 갖춘 <strong>젊은 층 선호 1순위 지역</strong>입니다.
        </p>

        <p className="text-lg leading-relaxed">
          하루의 소소한 행복, 🌸 <br/>
          그 시작은 바로 우리 동네 <strong>시지 라이프</strong>에서 
        </p>
      </div>
    </div>
  );
}
