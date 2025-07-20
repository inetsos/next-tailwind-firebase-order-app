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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="p-3 border rounded shadow-sm bg-white flex justify-between items-center text-sm
                 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
    >
      <span>{menu.name}</span>
      <span
        {...listeners}
        {...attributes}
        onClick={(e) => e.preventDefault()}
        className="cursor-grab select-none text-lg ml-2 text-gray-500 dark:text-gray-400"
        title="드래그로 순서 변경"
      >
        ≡
      </span>
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
        const categorySnapshot = await getDocs(
          query(collection(db, 'stores', storeId, 'categories'), orderBy('sortOrder', 'asc'))
        );
        const categoryList: CategoryInfo[] = categorySnapshot.docs.map((doc) => ({
          name: doc.data().name,
          sortOrder: doc.data().sortOrder ?? 0,
        }));
        setCategories(categoryList);

        const menuSnapshot = await getDocs(
          query(
            collection(db, 'stores', storeId, 'menus'),
            orderBy('category', 'asc'),
            orderBy('sortOrder', 'asc')
          )
        );
        const items: Menu[] = menuSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Menu[];

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
      const oIndex = menus.findIndex((m) => m.id === over.id);
      if (aIndex !== -1) {
        activeCategory = category;
        activeIndex = aIndex;
      }
      if (oIndex !== -1) {
        overCategory = category;
        overIndex = oIndex;
      }
    }

    if (activeCategory !== overCategory) return;

    const newMenus = arrayMove(menusByCategory[activeCategory], activeIndex, overIndex).map(
      (menu, idx) => ({ ...menu, sortOrder: idx })
    );

    setMenusByCategory((prev) => ({
      ...prev,
      [activeCategory]: newMenus,
    }));

    const batch = writeBatch(db);
    newMenus.forEach((menu) => {
      const ref = doc(db, 'stores', storeId, 'menus', menu.id);
      batch.update(ref, { sortOrder: menu.sortOrder });
    });
    await batch.commit();
  };

  if (loading)
    return (
      <p className="text-center py-10 text-gray-500 dark:text-gray-400">
        ⏳ 메뉴 불러오는 중...
      </p>
    );

  return (
    <div className="max-w-xl mx-auto mt-0 text-sm dark:text-gray-100">
      <div className="text-right -mt-2">
        <button
          onClick={() => router.push(`/store/${storeId}/menus`)}
          className="text-blue-600 hover:underline text-sm dark:text-blue-400"
        >
          ← 메뉴 관리
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-2">📦 메뉴 순서 정렬 (카테고리별)</h3>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {categories.map(({ name: category }) => {
          const menus = menusByCategory[category] ?? [];
          if (menus.length === 0) return null;
          return (
            <div key={category} className="mb-4">
              <h3 className="font-semibold text-md mb-2">{category}</h3>
              <SortableContext items={menus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1">
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
