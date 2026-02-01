'use client';

import { TaskStatus, Priority } from '@/types';
import { Filter, SortAsc, SortDesc } from 'lucide-react';

export type SortOption = 'created_at' | 'due_date' | 'priority';
export type SortOrder = 'asc' | 'desc';

interface FilterBarProps {
  statusFilter: TaskStatus | 'all';
  priorityFilter: Priority | 'all';
  sortBy: SortOption;
  sortOrder: SortOrder;
  onStatusFilterChange: (status: TaskStatus | 'all') => void;
  onPriorityFilterChange: (priority: Priority | 'all') => void;
  onSortChange: (sort: SortOption) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

export default function FilterBar({
  statusFilter,
  priorityFilter,
  sortBy,
  sortOrder,
  onStatusFilterChange,
  onPriorityFilterChange,
  onSortChange,
  onSortOrderChange,
}: FilterBarProps) {
  const statusOptions: { value: TaskStatus | 'all'; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '대기중' },
    { value: 'in_progress', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'overdue', label: '지연됨' },
  ];

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
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex flex-wrap items-center gap-4">
        {/* 상태 필터 */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as TaskStatus | 'all')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm
                       focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                상태: {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 우선순위 필터 */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as Priority | 'all')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm
                       focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                우선순위: {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 구분선 */}
        <div className="h-6 w-px bg-slate-200" />

        {/* 정렬 */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm
                       focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                정렬: {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg 
                       hover:bg-slate-100 transition-colors"
            title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4 text-slate-600" />
            ) : (
              <SortDesc className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
