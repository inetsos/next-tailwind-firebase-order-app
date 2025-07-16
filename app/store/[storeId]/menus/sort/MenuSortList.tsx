'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { Menu } from '@/types/menu';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';

interface MenuSortListProps {
  storeId: string;
}

interface CategoryInfo {
  name: string;
  sortOrder: number;
}

function SortableItem({ menu }: { menu: Menu }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: menu.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 border rounded shadow-sm bg-white flex justify-between items-center"
    >
      <span>{menu.name}</span>
      <span className="text-xs text-gray-400">({menu.sortOrder})</span>
    </li>
  );
}

export default function MenuSortList({ storeId }: MenuSortListProps) {
  const [menusByCategory, setMenusByCategory] = useState<Record<string, Menu[]>>({});
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 카테고리 목록 가져오기 (sortOrder 기준 정렬)
        const categorySnapshot = await getDocs(
          query(collection(db, 'stores', storeId, 'categories'), orderBy('sortOrder', 'asc'))
        );
        const categoryList: CategoryInfo[] = categorySnapshot.docs.map((doc) => ({
          name: doc.data().name,
          sortOrder: doc.data().sortOrder ?? 0,
        }));
        setCategories(categoryList);

        // 메뉴 목록 가져오기 (category, sortOrder 정렬)
        const menuSnapshot = await getDocs(
          query(collection(db, 'stores', storeId, 'menus'), orderBy('category', 'asc'), orderBy('sortOrder', 'asc'))
        );
        const items: Menu[] = menuSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Menu[];

        // 카테고리별 메뉴 그룹화
        const grouped: Record<string, Menu[]> = {};
        items.forEach((menu) => {
          if (!grouped[menu.category]) grouped[menu.category] = [];
          grouped[menu.category].push(menu);
        });
        setMenusByCategory(grouped);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let activeCategory = '';
    let overCategory = '';
    let activeIndex = -1;
    let overIndex = -1;

    for (const [category, menus] of Object.entries(menusByCategory)) {
      const aIndex = menus.findIndex((m) => m.id === active.id);
      if (aIndex !== -1) {
        activeCategory = category;
        activeIndex = aIndex;
      }
      const oIndex = menus.findIndex((m) => m.id === over.id);
      if (oIndex !== -1) {
        overCategory = category;
        overIndex = oIndex;
      }
    }

    if (activeCategory !== overCategory) return;

    const categoryMenus = menusByCategory[activeCategory];
    let newCategoryMenus = arrayMove(categoryMenus, activeIndex, overIndex);

    // 변경된 순서에 맞춰 sortOrder 재설정
    newCategoryMenus = newCategoryMenus.map((menu, index) => ({
      ...menu,
      sortOrder: index,
    }));

    setMenusByCategory((prev) => ({
      ...prev,
      [activeCategory]: newCategoryMenus,
    }));

    // Firestore에 sortOrder 업데이트
    const batch = writeBatch(db);
    newCategoryMenus.forEach((menu) => {
      const ref = doc(db, 'stores', storeId, 'menus', menu.id);
      batch.update(ref, { sortOrder: menu.sortOrder });
    });
    await batch.commit();
  };

  if (loading) return <p className="text-center py-10 text-gray-500">⏳ 메뉴 불러오는 중...</p>;

  return (
    <div className="max-w-xl mx-auto mt-4">
      <div className="text-right -mt-2">
        <button
          onClick={() => router.push(`/store/${storeId}/menus`)}
          className="text-blue-600 hover:underline text-sm"
        >
          ← 메뉴 관리
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-6">📦 메뉴 순서 정렬 (카테고리별)</h3>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {categories.map(({ name: category }) => {
          const menus = menusByCategory[category] ?? [];
          if (menus.length === 0) return null;
          return (
            <div key={category} className="mb-8">
              <h3 className="font-semibold text-md mb-3">{category}</h3>
              <SortableContext items={menus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                  {menus.map((menu) => (
                    <SortableItem key={menu.id} menu={menu} />
                  ))}
                </ul>
              </SortableContext>
            </div>
          );
        })}
      </DndContext>
    </div>
  );
}
