'use client';

import { useState } from 'react';
import { Task, Priority, TaskStatus } from '@/types';
import { Check, MoreVertical, Edit2, Trash2, Calendar } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityLabels: Record<Priority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
};

const statusLabels: Record<TaskStatus, string> = {
  pending: '대기',
  in_progress: '진행중',
  completed: '완료',
  overdue: '지연',
};

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isCompleted = task.status === 'completed';
  
  const getDueDateLabel = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isToday(date)) return '오늘';
    if (isTomorrow(date)) return '내일';
    if (isPast(date) && !isCompleted) return '지연';
    
    const diff = differenceInDays(date, new Date());
    if (diff <= 7 && diff > 0) return `D-${diff}`;
    
    return format(date, 'M/d', { locale: ko });
  };

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted;

  return (
    <div 
      className={`task-card bg-white rounded-lg p-3 border border-gray-200
                  ${isCompleted ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* 체크박스 */}
        <button
          onClick={() => onToggleComplete(task)}
          className={`custom-checkbox flex-shrink-0 mt-0.5 
                      ${isCompleted ? 'checked' : ''}`}
        >
          {isCompleted && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 
              className={`font-medium text-gray-800 text-sm
                          ${isCompleted ? 'line-through text-gray-400' : ''}`}
            >
              {task.title}
            </h3>
            
            {/* 메뉴 버튼 */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[100px]">
                    <button
                      onClick={() => {
                        onEdit(task);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      수정
                    </button>
                    <button
                      onClick={() => {
                        onDelete(task.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 설명 */}
          {task.description && (
            <p className={`mt-1 text-xs text-gray-500 line-clamp-1
                          ${isCompleted ? 'line-through' : ''}`}>
              {task.description}
            </p>
          )}

          {/* 태그들 */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* 우선순위 */}
            <span className={`priority-badge priority-${task.priority}`}>
              {priorityLabels[task.priority]}
            </span>

            {/* 상태 */}
            <span className={`status-badge status-${task.status}`}>
              {statusLabels[task.status]}
            </span>

            {/* 마감일 */}
            {task.due_date && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1
                               ${isOverdue ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                <Calendar className="w-3 h-3" />
                {getDueDateLabel(task.due_date)}
              </span>
            )}

            {/* 카테고리 */}
            {task.category && (
              <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                {task.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
