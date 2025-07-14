'use client';

import { useState, Fragment } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';

type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

export type BusinessHour = {
  opening: string;
  closing: string;
};

export type BusinessHours = Record<DayOfWeek, BusinessHour>;

interface Props {
  defaultValue: BusinessHours;
  onSave: (updatedHours: BusinessHours) => void;
  onCancel: () => void;
}

const days: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

const emptyBusinessHours: BusinessHours = {} as BusinessHours;
days.forEach(day => {
  emptyBusinessHours[day] = { opening: '', closing: '' };
});

export default function BusinessHoursModal({ defaultValue, onSave, onCancel }: Props) {
  const [localHours, setLocalHours] = useState<BusinessHours>(defaultValue);

  const handleChange = (day: DayOfWeek, field: 'opening' | 'closing', value: string) => {
    setLocalHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  // 복사 버튼 핸들러
  const handleCopyToAll = (sourceDay: DayOfWeek) => {
    const { opening, closing } = localHours[sourceDay];
    const copied: BusinessHours = {} as BusinessHours;

    days.forEach((day) => {
      copied[day] = { opening, closing };
    });

    setLocalHours(copied);
  };

  // 지우기 버튼 핸들러
  const handleClearAll = () => {
    setLocalHours(emptyBusinessHours);
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md bg-white p-6 rounded-xl shadow-xl">
              <DialogTitle className="text-xl font-bold mb-4">영업시간 설정</DialogTitle>

              <div className="space-y-3">
                {days.map((day) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-6">{day}</span>
                    <input
                      type="time"
                      value={localHours[day].opening}
                      onChange={(e) => handleChange(day, 'opening', e.target.value)}
                      className="flex-1 p-1 border rounded"
                    />
                    <span>~</span>
                    <input
                      type="time"
                      value={localHours[day].closing}
                      onChange={(e) => handleChange(day, 'closing', e.target.value)}
                      className="flex-1 p-1 border rounded"
                    />
                    <button
                      onClick={() => handleCopyToAll(day)}
                      className="text-sm text-blue-500 hover:underline"
                      title="모든 요일에 복사"
                    >
                      복사
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  지우기
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => onSave(localHours)}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>
              </div>             
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
