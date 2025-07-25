'use client';

import { useState, useEffect } from 'react';
import { OptionGroup, OptionItem } from '@/types/menu';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onAdd: (group: OptionGroup) => void;
  isRequired: boolean; // true = 필수 옵션, false = 선택 옵션
}

export default function OptionGroupForm({ onAdd, isRequired }: Props) {
  const [groupName, setGroupName] = useState('');
  const [minSelect, setMinSelect] = useState(isRequired ? 1 : 0);
  const [maxSelect, setMaxSelect] = useState(1);
  const [options, setOptions] = useState<OptionItem[]>([]);

  const addOptionItem = () => {
    setOptions((prev) => {
      const updated = [...prev, { id: uuidv4(), name: '', price: 0 }];
      return updated;
    });
  };

  useEffect(() => {
    setMaxSelect((prevMax) => Math.min(Math.max(prevMax, options.length), options.length));
  }, [options]);

  const updateOption = (id: string, field: keyof OptionItem, value: any) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt))
    );
  };

  const removeOption = (id: string) => {
    setOptions((prev) => {
      const updated = prev.filter((item) => item.id !== id);    
      return updated;    
    });
  };

  const handleAddGroup = () => {
    if (!groupName.trim() || options.length === 0) {
      alert('옵션 그룹 이름과 옵션 항목을 입력하세요.');
      return;
    }
    if (minSelect > maxSelect) {
      alert('최소 선택 수는 최대 선택 수보다 클 수 없습니다.');
      return;
    }
    if (maxSelect > options.length) {
      alert('최대 선택 수는 옵션 항목 개수를 초과할 수 없습니다.');
      return;
    }
    if (options.some((opt) => !opt.name.trim())) {
      alert('옵션 항목 이름을 모두 입력하세요.');
      return;
    }

    onAdd({
      id: uuidv4(),
      name: groupName,
      minSelect,
      maxSelect,
      options,
    });

    setGroupName('');
    setMinSelect(isRequired ? 1 : 0);
    setMaxSelect(1);
    setOptions([]);
  };

  return (
    <div className="border rounded p-4 mb-4">
      <h3 className="font-semibold mb-2">{isRequired ? '필수 옵션' : '선택 옵션'} 그룹 추가</h3>

      <input
        type="text"
        placeholder="옵션 그룹 이름"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        className="w-full border p-2 mb-4"
      />

      {/* min/max 선택 수 */}
      <div className="flex gap-4 mb-4">
        <div className="flex flex-col w-1/2">
          <label className="text-sm font-medium mb-1">최소 선택 수</label>
          <input
            type="number"
            value={minSelect}
            min={isRequired ? 1 : 0}
            onChange={(e) => setMinSelect(Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="border p-2"
          />
        </div>
        <div className="flex flex-col w-1/2">
          <label className="text-sm font-medium mb-1">최대 선택 수</label>
          <input
            type="number"
            value={maxSelect}
            min={1}
            max={options.length}
            onChange={(e) => setMaxSelect(Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="border p-2"
          />
        </div>
      </div>

      {/* 옵션 항목 추가 */}
      <div className="mb-2">
        <button onClick={addOptionItem} className="text-blue-500 text-sm">
          + 옵션 항목 추가
        </button>
      </div>

      {options.map((opt, index) => (
        <div key={opt.id} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder={`옵션 ${index + 1} 이름`}
            value={opt.name}
            onChange={(e) => updateOption(opt.id, 'name', e.target.value)}
            className="border p-2 w-1/2"
          />
          <input
            type="number"
            placeholder="추가 금액"
            value={opt.price}
            min={0}
            onChange={(e) => updateOption(opt.id, 'price', Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="border p-2 w-1/3"
          />
          <button
            onClick={() => removeOption(opt.id)}
            className="text-red-500 text-sm"
          >
            삭제
          </button>
        </div>
      ))}

      <button
        onClick={handleAddGroup}
        className="mt-4 bg-green-500 text-white px-3 py-1 rounded"
      >
        옵션 그룹 추가
      </button>
    </div>
  );
}
