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

export interface BusinessHour {
  opening: string;
  closing: string;
  breakStart?: string;
  breakEnd?: string;
}

export type BusinessHours = Record<DayOfWeek, BusinessHour>;

interface Props {
  defaultValue: BusinessHours;
  onSave: (updatedHours: BusinessHours) => void;
  onCancel: () => void;
}

const days: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

// 비어 있는 초기값
const emptyBusinessHours: BusinessHours = days.reduce((acc, day) => {
  acc[day] = { opening: '', closing: '', breakStart: '', breakEnd: '' };
  return acc;
}, {} as BusinessHours);

// 시간 입력 필드를 위한 컴포넌트 분리
function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col text-xs w-[7.5rem]">
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="p-1 border rounded dark:bg-gray-900 dark:border-gray-600"
      />
    </label>
  );
}

export default function BusinessHoursModal({ defaultValue, onSave, onCancel }: Props) {
  const [localHours, setLocalHours] = useState<BusinessHours>(defaultValue);

  // 시간 변경 핸들러
  const handleChange = (
    day: DayOfWeek,
    field: keyof BusinessHour,
    value: string
  ) => {
    setLocalHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  // 복사 버튼 핸들러 (opening, closing, breakStart, breakEnd 모두 복사)
  const handleCopyToAll = (sourceDay: DayOfWeek) => {
    const { opening, closing, breakStart = '', breakEnd = '' } = localHours[sourceDay];
    const copied: BusinessHours = days.reduce((acc, day) => {
      acc[day] = { opening, closing, breakStart, breakEnd };
      return acc;
    }, {} as BusinessHours);

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
            <DialogPanel
              className="w-full max-w-md max-h-[80vh] overflow-hidden bg-white rounded-xl shadow-xl dark:bg-gray-800 dark:text-white"
            >
              <div className="overflow-y-auto max-h-[80vh] p-6">
                <DialogTitle className="text-xl font-bold mb-4">영업시간 설정</DialogTitle>

                {/* 요일별 입력 필드 */}
                <div className="space-y-0 divide-y divide-gray-200 dark:divide-gray-700">
                  {days.map(day => (
                    <div key={day} className="pt-4 flex flex-col gap-2 text-sm">
                      {/* 요일 헤더 및 복사 버튼 */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{day}</span>
                        <button
                          onClick={() => handleCopyToAll(day)}
                          className="text-xs text-blue-500 hover:underline"
                          title="모든 요일에 복사"
                          type="button"
                        >
                          복사
                        </button>
                      </div>

                      {/* 영업 시간 그룹 */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-medium text-gray-500 dark:text-gray-400 w-[6rem] shrink-0">
                          영업 시간
                        </span>
                        <TimeInput
                          value={localHours[day].opening}
                          onChange={val => handleChange(day, 'opening', val)}
                        />
                        <span className="mx-1">~</span>
                        <TimeInput
                          value={localHours[day].closing}
                          onChange={val => handleChange(day, 'closing', val)}
                        />
                      </div>

                      {/* 휴게 시간 그룹 */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-medium text-gray-500 dark:text-gray-400 w-[6rem] shrink-0">
                          휴게 시간
                        </span>
                        <TimeInput
                          value={localHours[day].breakStart || ''}
                          onChange={val => handleChange(day, 'breakStart', val)}
                        />
                        <span className="mx-1">~</span>
                        <TimeInput
                          value={localHours[day].breakEnd || ''}
                          onChange={val => handleChange(day, 'breakEnd', val)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 하단 버튼 */}
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm"
                    type="button"
                  >
                    지우기
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={onCancel}
                      className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm"
                      type="button"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => onSave(localHours)}
                      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                      type="button"
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}