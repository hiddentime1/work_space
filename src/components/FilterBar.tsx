'use client';

import { Priority } from '@/types';
import { Filter, SortAsc, SortDesc } from 'lucide-react';

export type SortOption = 'created_at' | 'due_date' | 'priority';
export type SortOrder = 'asc' | 'desc';

interface FilterBarProps {
  priorityFilter: Priority | 'all';
  sortBy: SortOption;
  sortOrder: SortOrder;
  onPriorityFilterChange: (priority: Priority | 'all') => void;
  onSortChange: (sort: SortOption) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

export default function FilterBar({
  priorityFilter,
  sortBy,
  sortOrder,
  onPriorityFilterChange,
  onSortChange,
  onSortOrderChange,
}: FilterBarProps) {
  const priorityOptions: { value: Priority | 'all'; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'urgent', label: '긴급' },
    { value: 'high', label: '높음' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '낮음' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'created_at', label: '생성일' },
    { value: 'due_date', label: '마감일' },
    { value: 'priority', label: '우선순위' },
  ];

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-200">
      <div className="flex flex-wrap items-center gap-3">
        {/* 우선순위 필터 */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as Priority | 'all')}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm
                       focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                우선순위: {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 구분선 */}
        <div className="h-5 w-px bg-gray-200" />

        {/* 정렬 */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm
                       focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                정렬: {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg 
                       hover:bg-gray-100 transition-colors"
            title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4 text-gray-600" />
            ) : (
              <SortDesc className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
