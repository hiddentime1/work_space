'use client';

import { DashboardStats } from '@/types';
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
}

export default function Dashboard({ stats }: DashboardProps) {
  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 전체 */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">전체</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <ListTodo className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* 진행중 */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">진행중</p>
            <p className="text-2xl font-bold text-gray-900">{stats.in_progress + stats.pending}</p>
          </div>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* 완료 */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">완료</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-gray-400" />
        </div>
        {stats.total > 0 && (
          <div className="mt-2">
            <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gray-800 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{completionRate}% 완료</p>
          </div>
        )}
      </div>

      {/* 지연 */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">지연됨</p>
            <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
              {stats.overdue}
            </p>
          </div>
          <AlertTriangle className={`w-5 h-5 ${stats.overdue > 0 ? 'text-gray-600' : 'text-gray-300'}`} />
        </div>
        {stats.dueToday > 0 && (
          <p className="text-xs text-gray-500 mt-2">오늘 마감 {stats.dueToday}개</p>
        )}
      </div>
    </div>
  );
}
