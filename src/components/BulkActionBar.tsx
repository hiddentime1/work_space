'use client';

import { ArrowRight, Calendar } from 'lucide-react';

interface BulkActionBarProps {
  incompleteTodayCount: number;
  onMoveToTomorrow: () => void;
}

export default function BulkActionBar({ 
  incompleteTodayCount,
  onMoveToTomorrow 
}: BulkActionBarProps) {
  if (incompleteTodayCount === 0) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="w-4 h-4" />
        <span>오늘 미완료 업무 <strong>{incompleteTodayCount}개</strong></span>
      </div>
      <button
        onClick={onMoveToTomorrow}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                   text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        내일로 일괄 이관
      </button>
    </div>
  );
}
