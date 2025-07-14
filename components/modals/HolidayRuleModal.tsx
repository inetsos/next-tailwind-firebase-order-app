'use client';

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useState } from 'react';
// HolidayRuleModal.tsx
import type { HolidayRule, HolidayFrequency } from '@/types/store';


export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

interface HolidayRuleModalProps {
  isOpen: boolean;
  defaultValue: HolidayRule;
  onSave: (rule: HolidayRule) => void;
  onCancel: () => void;
}

const allDays: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

const emptyRule: HolidayRule = {
  frequency: '매주',
  days: [],
  weeks: [],
};

export default function HolidayRuleModal({ isOpen, defaultValue, onSave, onCancel }: HolidayRuleModalProps) {
  const [rule, setRule] = useState<HolidayRule>(defaultValue);

  const toggleDay = (day: DayOfWeek) => {
    setRule((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const toggleWeek = (week: number) => {
    setRule((prev) => ({
      ...prev,
      weeks: prev.weeks?.includes(week)
        ? prev.weeks.filter((w) => w !== week)
        : [...(prev.weeks || []), week],
    }));
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as HolidayFrequency;
    setRule({
      frequency: value,
      days: [],
      weeks: value === '매월 2회' ? [] : undefined,
    });
  };

  // 초기화(지우기) 버튼 클릭 시
  const handleClear = () => {
    setRule(emptyRule);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/30" />
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
            <DialogPanel className="w-full max-w-md bg-white rounded-xl p-6 shadow-xl">
              <DialogTitle className="text-lg font-semibold mb-4">휴무일 설정</DialogTitle>

              <div className="space-y-4">
                {/* 주기 선택 */}
                <div>
                  <label className="block text-sm font-medium mb-1">휴무 주기</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={rule.frequency}
                    onChange={handleFrequencyChange}
                  >
                    <option value="매주">매주</option>
                    <option value="격주">격주</option>
                    <option value="매월 1회">매월 1회</option>
                    <option value="매월 2회">매월 2회</option>
                  </select>
                </div>

                {/* 요일 선택 */}
                <div>
                  <label className="block text-sm font-medium mb-1">요일 선택</label>
                  <div className="flex gap-2 flex-wrap">
                    {allDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded border text-sm transition ${
                          rule.days.includes(day)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 주차 선택 */}
                {rule.frequency === '매월 2회' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">몇째 주</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((week) => (
                        <button
                          key={week}
                          type="button"
                          onClick={() => toggleWeek(week)}
                          className={`px-3 py-1.5 rounded border text-sm transition ${
                            rule.weeks?.includes(week)
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {week}주차
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={handleClear}
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
                    onClick={() => onSave(rule)}
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
