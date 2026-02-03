'use client';

import { useState, useMemo, useEffect } from 'react';
import { Task } from '@/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check,
  GripVertical,
  ArrowRight,
  Plus,
  Eye,
  EyeOff,
  Trash2
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
  subDays
} from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarViewProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onMoveTask: (taskId: string, newDate: string) => void;
  onEditTask: (task: Task) => void;
  onAddTask: (date: string) => void;
  onDeleteTask: (taskId: string) => void;
}

// 우선순위별 색상
const getPriorityColor = (priority: string, isCompleted: boolean) => {
  if (isCompleted) return 'bg-gray-100 text-gray-400';
  
  switch (priority) {
    case 'urgent':
      return 'bg-red-50 border-red-200 text-gray-700';
    case 'high':
      return 'bg-orange-50 border-orange-200 text-gray-700';
    case 'medium':
      return 'bg-white border-gray-200 text-gray-700';
    case 'low':
      return 'bg-gray-50 border-gray-200 text-gray-600';
    default:
      return 'bg-white border-gray-200 text-gray-700';
  }
};

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

export default function CalendarView({ 
  tasks, 
  onToggleComplete, 
  onMoveTask,
  onEditTask,
  onAddTask,
  onDeleteTask
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [showWeekend, setShowWeekend] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 주간 날짜 배열 생성 (월요일 시작)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    // 주말 숨김 처리
    if (!showWeekend) {
      return days.filter(day => !isWeekend(day));
    }
    return days;
  }, [currentDate, showWeekend]);

  // 날짜별 태스크 그룹화 (모바일: 현재 날짜만, 데스크탑: 주간)
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    if (isMobile) {
      // 모바일: 현재 선택된 날짜만
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      grouped[dateStr] = [];
      
      tasks.forEach(task => {
        if (task.due_date) {
          const taskDate = task.due_date.split('T')[0];
          if (taskDate === dateStr) {
            grouped[dateStr].push(task);
          }
        }
      });
    } else {
      // 데스크탑: 주간
      weekDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        grouped[dateStr] = [];
      });
      
      tasks.forEach(task => {
        if (task.due_date) {
          const taskDate = task.due_date.split('T')[0];
          if (grouped[taskDate]) {
            grouped[taskDate].push(task);
          }
        }
      });
    }
    
    // 우선순위로 정렬
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });
    
    return grouped;
  }, [tasks, weekDays, currentDate, isMobile]);

  // 이전/다음 (모바일: 일, 데스크탑: 주)
  const goToPrev = () => {
    if (isMobile) {
      setCurrentDate(subDays(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };
  
  const goToNext = () => {
    if (isMobile) {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };
  
  const goToToday = () => setCurrentDate(new Date());

  // 드래그 핸들러
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

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

  // 날짜별 통계
  const getDateStats = (dateStr: string) => {
    const dateTasks = tasksByDate[dateStr] || [];
    const completed = dateTasks.filter(t => t.status === 'completed').length;
    const total = dateTasks.length;
    return { completed, total };
  };

  const gridCols = showWeekend ? 'grid-cols-7' : 'grid-cols-5';

  // 모바일 뷰
  if (isMobile) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayTasks = tasksByDate[dateStr] || [];
    const stats = getDateStats(dateStr);
    const isCurrentDay = isToday(currentDate);

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 모바일 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button
            onClick={goToPrev}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">
              {format(currentDate, 'yyyy년 M월', { locale: ko })}
            </div>
            <div className={`text-2xl font-bold ${isCurrentDay ? 'text-gray-900' : 'text-gray-800'}`}>
              {format(currentDate, 'd일 (EEE)', { locale: ko })}
            </div>
            {stats.total > 0 && (
              <div className="text-xs text-gray-400 mt-0.5">
                {stats.completed}/{stats.total} 완료
              </div>
            )}
          </div>
          
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* 오늘 버튼 */}
        {!isCurrentDay && (
          <div className="px-4 py-2 border-b border-gray-100">
            <button
              onClick={goToToday}
              className="w-full py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              오늘로 이동
            </button>
          </div>
        )}

        {/* 태스크 목록 */}
        <div className="p-4 space-y-2 min-h-[200px]">
          {dayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Plus className="w-8 h-8 mb-2" />
              <p className="text-sm">업무가 없습니다</p>
              <button
                onClick={() => onAddTask(dateStr)}
                className="mt-3 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg"
              >
                업무 추가
              </button>
            </div>
          ) : (
            dayTasks.map(task => (
              <div
                key={task.id}
                onClick={() => onEditTask(task)}
                className={`p-4 rounded-xl transition-all active:scale-[0.98] border
                           ${getPriorityColor(task.priority, task.status === 'completed')}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(task);
                    }}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0
                               flex items-center justify-center mt-0.5
                               ${task.status === 'completed'
                                 ? 'bg-gray-400 border-gray-400'
                                 : task.priority === 'urgent'
                                   ? 'border-red-400'
                                   : task.priority === 'high'
                                     ? 'border-orange-400'
                                     : 'border-gray-300'}`}
                  >
                    {task.status === 'completed' && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {(task.priority === 'urgent' || task.priority === 'high') && (
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium
                                      ${getPriorityBadgeColor(task.priority)}`}>
                        {task.priority === 'urgent' ? '긴급' : '높음'}
                      </span>
                    )}
                  </div>
                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('이 업무를 삭제하시겠습니까?')) {
                        onDeleteTask(task.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 추가 버튼 */}
        {dayTasks.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => onAddTask(dateStr)}
              className="w-full py-3 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">업무 추가</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 데스크탑 뷰
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToNext}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-medium text-gray-800 ml-2">
            {format(weekDays[0], 'yyyy년 M월', { locale: ko })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 주말 토글 */}
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

      {/* 캘린더 그리드 */}
      <div className={`grid ${gridCols} divide-x divide-gray-100`}>
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateStr] || [];
          const stats = getDateStats(dateStr);
          const isCurrentDay = isToday(day);
          const isPastDay = isPast(day) && !isCurrentDay;
          const isDragOver = dragOverDate === dateStr;
          const isWeekendDay = isWeekend(day);

          return (
            <div
              key={dateStr}
              className={`min-h-[200px] flex flex-col transition-colors
                         ${isDragOver ? 'bg-gray-50' : ''}
                         ${isPastDay ? 'bg-gray-50/50' : ''}
                         ${isWeekendDay ? 'bg-gray-50/30' : ''}`}
              onDragOver={(e) => handleDragOver(e, dateStr)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateStr)}
            >
              {/* 날짜 헤더 */}
              <div className={`p-2 text-center border-b border-gray-100 relative group
                              ${isCurrentDay ? 'bg-gray-900' : ''}`}>
                <div className={`text-xs ${isCurrentDay ? 'text-gray-300' : isWeekendDay ? 'text-gray-400' : 'text-gray-500'}`}>
                  {format(day, 'EEE', { locale: ko })}
                </div>
                <div className={`text-lg font-semibold 
                                ${isCurrentDay ? 'text-white' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </div>
                {stats.total > 0 && (
                  <div className={`text-xs ${isCurrentDay ? 'text-gray-400' : 'text-gray-400'}`}>
                    {stats.completed}/{stats.total}
                  </div>
                )}
                {/* 추가 버튼 */}
                <button
                  onClick={() => onAddTask(dateStr)}
                  className={`absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                             ${isCurrentDay ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* 태스크 목록 */}
              <div className="flex-1 p-1 space-y-1 overflow-y-auto max-h-[300px]">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onEditTask(task)}
                    className={`group p-2 rounded-lg text-xs cursor-move
                               transition-all hover:shadow-md border
                               ${task.status === 'completed' 
                                 ? 'bg-gray-100 text-gray-400 line-through border-gray-100' 
                                 : task.priority === 'urgent'
                                   ? 'bg-red-50 border-red-200 text-gray-700 hover:border-red-300'
                                   : task.priority === 'high'
                                     ? 'bg-orange-50 border-orange-200 text-gray-700 hover:border-orange-300'
                                     : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}
                               ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-1">
                      <GripVertical className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleComplete(task);
                            }}
                            className={`w-3.5 h-3.5 rounded border flex-shrink-0
                                       flex items-center justify-center
                                       ${task.status === 'completed'
                                         ? 'bg-gray-400 border-gray-400'
                                         : task.priority === 'urgent'
                                           ? 'border-red-400 hover:border-red-500'
                                           : task.priority === 'high'
                                             ? 'border-orange-400 hover:border-orange-500'
                                             : 'border-gray-300 hover:border-gray-400'}`}
                          >
                            {task.status === 'completed' && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </button>
                          <span className="truncate">{task.title}</span>
                        </div>
                        {task.priority === 'urgent' || task.priority === 'high' ? (
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                                          ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority === 'urgent' ? '긴급' : '높음'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
                
                {dayTasks.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    {isDragOver ? (
                      <span className="text-gray-400 text-xs">여기에 놓기</span>
                    ) : (
                      <button
                        onClick={() => onAddTask(dateStr)}
                        className="p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 드래그 안내 */}
      {draggedTask && (
        <div className="p-2 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
          <ArrowRight className="w-3 h-3 inline mr-1" />
          다른 날짜로 드래그하여 이동
        </div>
      )}
    </div>
  );
}
