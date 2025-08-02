'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';

interface FoodAlley {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
}

export default function FoodAlleyListPage() {
  const [alleys, setAlleys] = useState<FoodAlley[]>([]);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'foodAlleys'), orderBy('sortOrder', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<FoodAlley, 'id'>),
      }));
      setAlleys(list);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'foodAlleys', id));
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isMobile ? { distance: 10 } : undefined,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = alleys.findIndex((a) => a.id === active.id);
    const newIndex = alleys.findIndex((a) => a.id === over.id);

    const newList = arrayMove(alleys, oldIndex, newIndex);
    setAlleys(newList);

    // Firestore에 sortOrder 업데이트
    const batch = writeBatch(db);
    newList.forEach((item, index) => {
      const ref = doc(db, 'foodAlleys', item.id);
      batch.update(ref, { sortOrder: index });
    });
    await batch.commit();
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      {/* ⬇️ 운영자 페이지로 돌아가기 링크 */}
      <div className="mb-4 text-end">
        <Link
          href="/operator"
          className="text-sm text-blue-600 hover:underline"
        >
          ← 운영자 페이지로 돌아가기
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">먹자 골목 관리</h1>
        <Link
          href="/operator/food-alleys/create"
          className="text-blue-500 underline"
        >
          + 먹자 골목 등록
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={alleys.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-4">
            {alleys.map((alley) => (
              <SortableItem
                key={alley.id}
                alley={alley}
                onDelete={() => handleDelete(alley.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableItem({
  alley,
  onDelete,
}: {
  alley: FoodAlley;
  onDelete: () => void;
}) {
  const router = useRouter();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: alley.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="border border-gray-300 p-4 rounded-md flex justify-between items-center bg-white shadow-sm"
    >
      <div className="flex gap-2 items-start w-full">
        {/* Drag Handle */}
        <div
          {...listeners}
          className="cursor-grab mt-1 text-gray-400 hover:text-black"
          title="드래그로 순서 변경"
        >
          ☰
        </div>

        <div className="w-full">
          <h2 className="text-lg font-semibold">{alley.name}</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {alley.description}
          </p>
          <p className="text-xs text-gray-400 mt-1">정렬 순서: {alley.sortOrder}</p>
        </div>
      </div>

      <div className="ml-2 shrink-0 flex flex-col items-end gap-2">
        <button
          onClick={() => router.push(`/operator/food-alleys/${alley.id}/stores`)}
          className="text-blue-600 hover:underline text-sm"
        >
          매장 등록
        </button>
        <button
          onClick={onDelete}
          className="text-red-500 hover:underline text-sm"
        >
          삭제
        </button>
      </div>
    </li>
  );
}
