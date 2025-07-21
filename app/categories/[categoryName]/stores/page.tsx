// app/categories/[categoryName]/stores/page.tsx

import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Store } from '@/types/store';
import { convertFirestoreTimestamp } from '@/utils/firestoreUtils';
import StoreMap from '@/components/StoreMap';
import StoreList from '@/components/StoreList';

export const dynamic = 'force-dynamic'; // ✅ 중요

interface PageProps {
  params: Promise<{
    categoryName: string;
  }>;
}

export default async function CategoryStorePage({ params }: PageProps) {
   const { categoryName } = await params;
  const decodedCategoryName = decodeURIComponent(categoryName);

  const q = query(
    collection(db, 'stores'),
    where('category', '==', decodedCategoryName)
  );

  const snapshot = await getDocs(q);

  const stores: Store[] = snapshot.docs.map(doc =>
    convertFirestoreTimestamp({ id: doc.id, ...(doc.data() as Omit<Store, 'id'>) })
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{decodedCategoryName} 카테고리</h1>
      {stores.length === 0 ? (
        <p>해당 카테고리의 매장이 없습니다.</p>
      ) : (
        <>
          <StoreMap stores={stores} /> {/* ✅ 지도 먼저 보여주고 */}
          <StoreList stores={stores} /> {/* ✅ 리스트도 함께 */}
        </>
      )}
    </div>
  );
}
