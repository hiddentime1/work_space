'use client';

import { useState, useMemo } from 'react';
import { Task } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  GripVertical,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  ListChecks,
  PauseCircle,
  Users,
  Briefcase,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  addDays,
  isToday,
  isPast,
  addWeeks,
  subWeeks,
  isWeekend,
} from 'date-fns';
import { ko } from 'date-fns/locale';

interface VerticalViewProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onMoveTask: (taskId: string, newDate: string) => void;
  onEditTask: (task: Task) => void;
  onAddTask: (date: string) => void;
  onDeleteTask: (taskId: string) => void;
  onHoldTask: (taskId: string) => void;
  onOpenChecklist?: (date: string) => void;
}

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    default:
      return 'bg-gray-200 text-gray-700';
  }
};

const priorityLabel = (priority: string) =>
  priority === 'urgent' ? '긴급' : priority === 'high' ? '높음' : priority === 'medium' ? '보통' : '낮음';

export default function VerticalView({
  tasks,
  onToggleComplete,
  onMoveTask,
  onEditTask,
  onAddTask,
  onDeleteTask,
  onHoldTask,
  onOpenChecklist,
}: VerticalViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [showWeekend, setShowWeekend] = useState(false);

  // 주간 날짜 배열 (월요일 시작)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return showWeekend ? days : days.filter((day) => !isWeekend(day));
  }, [currentDate, showWeekend]);

  // 날짜별 그룹화 (보류 업무는 due_date가 비어 자동 제외됨)
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    weekDays.forEach((day) => {
      grouped[format(day, 'yyyy-MM-dd')] = [];
    });
    tasks.forEach((task) => {
      if (task.due_date) {
        const taskDate = task.due_date.split('T')[0];
        if (grouped[taskDate]) grouped[taskDate].push(task);
      }
    });
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      });
    });
    return grouped;
  }, [tasks, weekDays]);

  const goToPrev = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNext = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(dateStr);
  };
  const handleDragLeave = () => setDragOverDate(null);
  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.due_date?.split('T')[0] !== dateStr) {
      onMoveTask(draggedTask.id, dateStr);
    }
    setDraggedTask(null);
    setDragOverDate(null);
  };
  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverDate(null);
  };

  // 개별 업무 카드 렌더 (업무/미팅 공용)
  const renderTask = (task: Task) => {
    const isCompleted = task.status === 'completed';
    const isMeeting = task.task_type === 'meeting';
    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        className={`group rounded-xl border p-3.5 transition-all
                   ${isCompleted
                     ? 'bg-gray-50 border-gray-100'
                     : isMeeting
                       ? 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-300'
                       : task.priority === 'urgent'
                         ? 'bg-red-50/60 border-red-200'
                         : task.priority === 'high'
                           ? 'bg-orange-50/60 border-orange-200'
                           : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}
                   ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
      >
        <div className="flex items-start gap-3">
          <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
          <button
            onClick={() => onToggleComplete(task)}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5
                       ${isCompleted
                         ? 'bg-gray-400 border-gray-400'
                         : isMeeting
                           ? 'border-indigo-400'
                           : task.priority === 'urgent'
                             ? 'border-red-400'
                             : task.priority === 'high'
                               ? 'border-orange-400'
                               : 'border-gray-300'}`}
          >
            {isCompleted && <Check className="w-4 h-4 text-white" />}
          </button>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEditTask(task)}>
            <p className={`font-semibold text-[15px] leading-snug ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.title}
            </p>
            {task.description && (
              <p className={`text-sm text-gray-500 mt-1 whitespace-pre-wrap break-words ${isCompleted ? 'line-through' : ''}`}>
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {(task.priority === 'urgent' || task.priority === 'high') && (
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${getPriorityBadgeColor(task.priority)}`}>
                  {priorityLabel(task.priority)}
                </span>
              )}
              {task.category && (
                <span className="px-2 py-0.5 rounded-md text-[11px] bg-gray-100 text-gray-500">
                  {task.category}
                </span>
              )}
            </div>
          </div>

          {/* 액션: 보류 / 삭제 */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHoldTask(task.id);
              }}
              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="보류하기"
            >
              <PauseCircle className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('이 업무를 삭제하시겠습니까?')) onDeleteTask(task.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="삭제"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 헤더: 주 이동 */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between sticky top-[73px] z-30">
        <div className="flex items-center gap-2">
          <button onClick={goToPrev} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={goToNext} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-800 ml-2">
            {format(weekDays[0], 'yyyy년 M월', { locale: ko })} · {format(weekDays[0], 'd일', { locale: ko })}~
            {format(weekDays[weekDays.length - 1], 'd일', { locale: ko })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeekend(!showWeekend)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                       ${showWeekend ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {showWeekend ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            주말
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            오늘
          </button>
        </div>
      </div>

      {/* 날짜별 큰 영역 (세로 스택) */}
      {weekDays.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTasks = tasksByDate[dateStr] || [];
        const completed = dayTasks.filter((t) => t.status === 'completed').length;
        const total = dayTasks.length;
        const isCurrentDay = isToday(day);
        const isPastDay = isPast(day) && !isCurrentDay;
        const isDragOver = dragOverDate === dateStr;

        return (
          <div
            key={dateStr}
            onDragOver={(e) => handleDragOver(e, dateStr)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, dateStr)}
            className={`bg-white rounded-2xl border transition-colors overflow-hidden
                       ${isDragOver ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'}
                       ${isPastDay ? 'opacity-90' : ''}`}
          >
            {/* 날짜 헤더 */}
            <div
              className={`flex items-center justify-between px-5 py-3 border-b
                         ${isCurrentDay ? 'bg-blue-500 border-blue-500' : 'bg-gray-50 border-gray-100'}`}
            >
              <div className="flex items-baseline gap-2.5">
                <span className={`text-2xl font-extrabold ${isCurrentDay ? 'text-white' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </span>
                <span className={`text-sm font-semibold ${isCurrentDay ? 'text-blue-50' : 'text-gray-500'}`}>
                  {format(day, 'EEEE', { locale: ko })}
                </span>
                {isCurrentDay && (
                  <span className="text-xs font-bold bg-white/25 text-white px-2 py-0.5 rounded-full">오늘</span>
                )}
                {total > 0 && (
                  <span className={`text-xs font-medium ${isCurrentDay ? 'text-blue-50' : 'text-gray-400'}`}>
                    {completed}/{total} 완료
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {onOpenChecklist && (
                  <button
                    onClick={() => onOpenChecklist(dateStr)}
                    className={`p-1.5 rounded-lg transition-colors
                               ${isCurrentDay ? 'hover:bg-white/20 text-white' : 'hover:bg-emerald-100 text-emerald-500'}`}
                    title="일일 체크리스트"
                  >
                    <ListChecks className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => onAddTask(dateStr)}
                  className={`p-1.5 rounded-lg transition-colors
                             ${isCurrentDay ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-500'}`}
                  title="업무 추가"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 업무 목록 (넉넉한 영역) — 미팅 층 / 업무 층 분리 */}
            <div className="p-3 space-y-2 min-h-[88px]">
              {(() => {
                if (dayTasks.length === 0) {
                  return (
                    <button
                      onClick={() => onAddTask(dateStr)}
                      className="w-full py-6 flex flex-col items-center justify-center gap-1.5 text-gray-300
                                 hover:text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-sm font-medium">
                        {isDragOver ? '여기에 놓기' : '업무 추가'}
                      </span>
                    </button>
                  );
                }

                const meetings = dayTasks.filter((t) => t.task_type === 'meeting');
                const works = dayTasks.filter((t) => t.task_type !== 'meeting');

                // 미팅이 하나도 없으면 층 구분 없이 그대로 표기
                if (meetings.length === 0) {
                  return <>{works.map(renderTask)}</>;
                }

                return (
                  <div className="space-y-3">
                    {/* 미팅 층 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 px-1">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-600">미팅</span>
                        <span className="text-xs text-gray-400">{meetings.length}</span>
                      </div>
                      {meetings.map(renderTask)}
                    </div>

                    {/* 업무 층 (있을 때만) */}
                    {works.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-dashed border-gray-200">
                        <div className="flex items-center gap-1.5 px-1 pt-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-bold text-gray-600">업무</span>
                          <span className="text-xs text-gray-400">{works.length}</span>
                        </div>
                        {works.map(renderTask)}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}

      {draggedTask && (
        <div className="sticky bottom-2 bg-gray-900 text-white text-center text-xs py-2 rounded-lg shadow-lg">
          다른 날짜 영역에 놓으면 이동돼요
        </div>
      )}
    </div>
  );
}
