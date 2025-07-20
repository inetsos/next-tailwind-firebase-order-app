'use client';

import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface CategoryManagerRef {
  fetchCategories: () => void;
}

interface CategoryManagerProps {
  storeId: string;
}

const CategoryManager = forwardRef<CategoryManagerRef, CategoryManagerProps>(
  ({ storeId }, ref) => {
    const [categories, setCategories] = useState<Category[]>([]);

    const fetchCategories = async () => {
      const q = query(
        collection(db, 'stores', storeId, 'categories'),
        orderBy('sortOrder', 'asc')
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Category, 'id'>),
      }));
      setCategories(items);
    };

    useImperativeHandle(ref, () => ({
      fetchCategories,
    }));

    useEffect(() => {
      fetchCategories();
    }, [storeId]);

    const handleDelete = async (id: string) => {
      await deleteDoc(doc(db, 'stores', storeId, 'categories', id));
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    };

    const handleSortOrderChange = async (id: string, newSortOrder: number) => {
      await updateDoc(doc(db, 'stores', storeId, 'categories', id), {
        sortOrder: newSortOrder,
      });
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, sortOrder: newSortOrder } : cat
        )
      );
    };

    const handleDragEnd = async (event: any) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(categories, oldIndex, newIndex);

      setCategories(reordered);

      await Promise.all(
        reordered.map((cat, idx) =>
          updateDoc(doc(db, 'stores', storeId, 'categories', cat.id), {
            sortOrder: idx,
          })
        )
      );

      await fetchCategories();
    };

    return (
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
          📋 등록된 카테고리
        </h2>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {categories.map((cat) => (
                <SortableCategoryItem
                  key={cat.id}
                  category={cat}
                  onDelete={handleDelete}
                  onSortChange={handleSortOrderChange}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    );
  }
);

export default CategoryManager;

function SortableCategoryItem({
  category,
  onDelete,
  onSortChange,
}: {
  category: Category;
  onDelete: (id: string) => void;
  onSortChange: (id: string, sortOrder: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="p-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-2"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 dark:text-gray-500 select-none pr-2"
      >
        ≡
      </div>

      <span className="flex-1 truncate text-gray-900 dark:text-gray-100">
        {category.name}
      </span>

      <input
        type="number"
        value={category.sortOrder}
        onChange={(e) => onSortChange(category.id, Number(e.target.value))}
        className="w-16 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-black dark:text-white p-1 rounded"
      />

      <button
        onClick={() => onDelete(category.id)}
        className="text-red-500 dark:text-red-400 text-xs hover:underline"
      >
        삭제
      </button>
    </li>
  );
}
