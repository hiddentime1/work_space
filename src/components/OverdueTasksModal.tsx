'use client';

import { Task } from '@/types';
import { X, AlertCircle, ArrowRight, CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface OverdueTasksModalProps {
  tasks: Task[];
  onClose: () => void;
  onMoveToToday: (taskId: string) => void;
  onMoveAllToToday: () => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function OverdueTasksModal({
  tasks,
  onClose,
  onMoveToToday,
  onMoveAllToToday,
  onComplete,
  onDelete,
}: OverdueTasksModalProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-lg" 
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                미완료 업무가 있습니다
              </h2>
              <p className="text-sm text-gray-500">
                {tasks.length}개의 업무가 아직 완료되지 않았어요
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 업무 목록 */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
          {tasks.map(task => (
            <div 
              key={task.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">
                  {task.title}
                </p>
                <p className="text-xs text-gray-500">
                  마감: {task.due_date 
                    ? format(new Date(task.due_date), 'M월 d일 (EEE)', { locale: ko })
                    : '없음'}
                </p>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onComplete(task.id)}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  title="완료 처리"
                >
                  <CheckCircle2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => onMoveToToday(task.id)}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  title="오늘로 이관"
                >
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <button 
            onClick={onClose} 
            className="btn-secondary flex-1"
          >
            나중에
          </button>
          <button 
            onClick={onMoveAllToToday}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            전체 오늘로 이관
          </button>
        </div>
      </div>
    </div>
  );
}
