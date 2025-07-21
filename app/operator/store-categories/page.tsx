'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, orderBy, writeBatch, doc } from 'firebase/firestore';
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
import Link from 'next/link';

interface StoreCategory {
  id: string;
  name: string;
  industries: string[];
  sortOrder: number;
}

function SortableItem({
  id,
  name,
  industries,
  sortOrder,
  onClick,
}: {
  id: string;
  name: string;
  industries: string[];
  sortOrder: number;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? '#e0f2fe' : '',
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="border rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800 flex items-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="link"
      aria-label={`${name} 분류 수정 페이지로 이동`}
    >
      {/* 드래그 핸들러 */}
      <div
        {...listeners}
        className="cursor-grab p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="드래그하여 순서 변경"
        onClick={(e) => e.stopPropagation()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </div>

      {/* 내용 영역 */}
      <div className="flex-grow text-left">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
          {sortOrder + 1}. {name}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          업종: {industries.join(', ') || '없음'}
        </p>
      </div>
    </li>
  );
}

export default function StoreCategoryListPage() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const q = query(collection(db, 'store-categories'), orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as StoreCategory[];
      setCategories(data);
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over?.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newCategories = arrayMove(categories, oldIndex, newIndex);

      const updatedCategories = newCategories.map((cat, index) => ({
        ...cat,
        sortOrder: index,
      }));

      setCategories(updatedCategories);

      const batch = writeBatch(db);
      updatedCategories.forEach(cat => {
        const docRef = doc(db, 'store-categories', cat.id);
        batch.update(docRef, { sortOrder: cat.sortOrder });
      });

      try {
        await batch.commit();
      } catch (error) {
        console.error('Firestore 순서 업데이트 실패', error);
        alert('순서 저장에 실패했습니다. 새로고침 후 다시 시도하세요.');
      }
    }
  };

  if (loading) return <p className="p-6 text-center">로딩 중...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">매장 분류</h1>
        <Link href="/operator/store-categories/new" className="text-blue-500 underline">
          + 새 분류
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((cat) => cat.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-4">
            {categories.map((cat) => (
              <SortableItem
                key={cat.id}
                id={cat.id}
                name={cat.name}
                industries={cat.industries}
                sortOrder={cat.sortOrder}
                onClick={() => {
                  window.location.href = `/operator/store-categories/${cat.id}/edit`;
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
