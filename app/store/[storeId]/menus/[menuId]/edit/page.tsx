'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import MenuForm from '@/components/MenuForm';
import { Menu } from '@/types/menu';

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const { storeId, menuId } = params as { storeId: string; menuId: string };

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId || !menuId) return;   

    const fetchMenu = async () => {
      try {
        const docRef = doc(db, 'stores', storeId, 'menus', menuId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setMenu({ id: snap.id, ...snap.data() } as Menu);
        } else {
          alert('메뉴 정보를 찾을 수 없습니다.');
          router.push(`/store/${storeId}/menus`);
        }
      } catch (error) {
        console.error('메뉴 가져오기 실패:', error);
        alert('메뉴 정보를 불러오는데 실패했습니다.');
        router.push(`/store/${storeId}/menus`);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [storeId, menuId]);

  const handleUpdate = async (updatedMenu: Omit<Menu, 'id'>) => {
    try {
      const docRef = doc(db, 'stores', storeId!, 'menus', menuId!);
      await updateDoc(docRef, updatedMenu);
      alert('메뉴가 수정되었습니다.');
      router.push(`/store/${storeId}/menus`);
    } catch (error) {
      console.error('메뉴 수정 실패:', error);
      alert('메뉴 수정 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <p className="p-6 text-center">⏳ 불러오는 중...</p>;
  if (!menu) return null;

  return (
    <MenuForm storeId={storeId} menuData={menu} onSubmit={handleUpdate} />
  );
}
