'use client';

import { useState, useEffect } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput, Priority } from '@/types';
import { X } from 'lucide-react';

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => void;
  onClose: () => void;
}

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '보통' },
  { value: 'high', label: '높음' },
  { value: 'urgent', label: '긴급' },
];

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function TaskForm({ task, onSubmit, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  // 새 업무는 기본값 오늘, 수정 시에는 기존 날짜 유지
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split('T')[0] : getTodayString()
  );
  const [category, setCategory] = useState(task?.category || '');

  const isEditing = !!task;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const data: CreateTaskInput | UpdateTaskInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      category: category.trim() || undefined,
    };

    onSubmit(data);
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? '업무 수정' : '새 업무'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="무엇을 해야 하나요?"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg 
                         text-gray-800 text-sm placeholder:text-gray-400"
              autoFocus
              required
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              설명 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="추가 설명..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg 
                         text-gray-800 text-sm placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* 우선순위 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              우선순위
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border 
                             transition-colors
                             ${priority === option.value 
                               ? 'bg-gray-900 text-white border-gray-900' 
                               : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 마감일 & 카테고리 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                마감일
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg 
                           text-gray-800 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                카테고리 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="예: 개발"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg 
                           text-gray-800 text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              취소
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isEditing ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
