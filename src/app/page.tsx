'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput, DashboardStats, Priority, Memo } from '@/types';
import Dashboard from '@/components/Dashboard';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import KakaoConnect from '@/components/KakaoConnect';
import FilterBar, { SortOption, SortOrder } from '@/components/FilterBar';
import CalendarView from '@/components/CalendarView';
import OverdueTasksModal from '@/components/OverdueTasksModal';
import BulkActionBar from '@/components/BulkActionBar';
import MemoButton from '@/components/MemoButton';
import Toast, { useToast, ToastData } from '@/components/Toast';
import { Plus, Bell, RefreshCw, ListTodo, Calendar, List } from 'lucide-react';
import { isToday, startOfDay, addDays } from 'date-fns';

type ViewMode = 'list' | 'calendar';

export default function Home() {
  // 상태 관리
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, pending: 0, in_progress: 0, completed: 0, 
    overdue: 0, completedToday: 0, dueToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // 뷰 모드 (기본: 캘린더)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // 필터 & 정렬
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // 카카오 연결 상태
  const [isKakaoConnected, setIsKakaoConnected] = useState(false);
  const [isNotificationActive, setIsNotificationActive] = useState(true);
  
  // 미완료 업무 팝업
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const hasCheckedOverdue = useRef(false);
  
  // 토스트
  const { toasts, showToast, removeToast } = useToast();

  // 초기 로드 여부 (중복 호출 방지)
  const isInitialized = useRef(false);

  // 지난 날짜의 미완료 업무 (어제 이전)
  const overdueTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      if (!task.due_date) return false;
      const dueDate = startOfDay(new Date(task.due_date));
      return dueDate < today;
    });
  }, [tasks]);

  // 오늘 미완료 업무
  const incompleteTodayTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      if (!task.due_date) return false;
      return isToday(new Date(task.due_date));
    });
  }, [tasks]);

  // 데이터 로드 함수
  const fetchTasks = async (
    priority: Priority | 'all',
    sort: SortOption,
    order: SortOrder
  ) => {
    try {
      const params = new URLSearchParams();
      if (priority !== 'all') params.append('priority', priority);
      params.append('sortBy', sort);
      params.append('sortOrder', order);

      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      showToast('업무 목록을 불러오는데 실패했습니다.', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const fetchMemos = async () => {
    try {
      const res = await fetch('/api/memos');
      const data = await res.json();
      if (data.success) {
        setMemos(data.data);
      }
    } catch (error) {
      console.error('메모 로드 실패:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const res = await fetch('/api/notification/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setIsKakaoConnected(!!data.data.kakao_access_token);
        setIsNotificationActive(data.data.is_active);
      }
    } catch (error) {
      console.error('알림 설정 로드 실패:', error);
    }
  };

  // 초기 로드 (한 번만 실행)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchTasks(priorityFilter, sortBy, sortOrder),
        fetchStats(),
        fetchMemos(),
        fetchNotificationSettings()
      ]);
      setIsLoading(false);
    };
    loadData();

    // URL 파라미터로 카카오 연결 상태 확인
    const params = new URLSearchParams(window.location.search);
    if (params.get('kakao_connected') === 'true') {
      showToast('카카오톡이 연결되었습니다!', 'success');
      setIsKakaoConnected(true);
      window.history.replaceState({}, '', '/');
    }
    if (params.get('kakao_error')) {
      showToast('카카오톡 연결에 실패했습니다.', 'error');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // 미완료 업무 체크 (데이터 로드 후 한 번만)
  useEffect(() => {
    if (!isLoading && !hasCheckedOverdue.current && overdueTasks.length > 0) {
      hasCheckedOverdue.current = true;
      setShowOverdueModal(true);
    }
  }, [isLoading, overdueTasks.length]);

  // 필터 변경 핸들러
  const handleFilterChange = async (
    newPriority?: Priority | 'all',
    newSortBy?: SortOption,
    newSortOrder?: SortOrder
  ) => {
    const priority = newPriority ?? priorityFilter;
    const sort = newSortBy ?? sortBy;
    const order = newSortOrder ?? sortOrder;

    if (newPriority !== undefined) setPriorityFilter(priority);
    if (newSortBy !== undefined) setSortBy(sort);
    if (newSortOrder !== undefined) setSortOrder(order);

    await fetchTasks(priority, sort, order);
  };

  // 데이터 새로고침 (태스크 + 통계)
  const refreshData = async () => {
    await Promise.all([
      fetchTasks(priorityFilter, sortBy, sortOrder),
      fetchStats()
    ]);
  };

  // 태스크 생성/수정 통합 핸들러
  const handleSubmitTask = async (data: CreateTaskInput | UpdateTaskInput) => {
    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        
        if (result.success) {
          showToast('업무가 수정되었습니다!', 'success');
          setEditingTask(null);
          refreshData();
        } else {
          showToast(result.error || '업무 수정에 실패했습니다.', 'error');
        }
      } else {
        // 선택된 날짜가 있으면 해당 날짜로 설정
        const taskData = selectedDate 
          ? { ...data, due_date: new Date(selectedDate).toISOString() }
          : data;
          
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        const result = await res.json();
        
        if (result.success) {
          showToast('업무가 추가되었습니다!', 'success');
          setShowForm(false);
          setSelectedDate(null);
          refreshData();
        } else {
          showToast(result.error || '업무 추가에 실패했습니다.', 'error');
        }
      }
    } catch (error) {
      showToast(editingTask ? '업무 수정에 실패했습니다.' : '업무 추가에 실패했습니다.', 'error');
    }
  };

  // 완료 토글
  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      
      if (result.success) {
        if (newStatus === 'completed') {
          showToast('업무를 완료했습니다!', 'success');
        }
        refreshData();
      }
    } catch (error) {
      showToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  // 태스크 삭제
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const result = await res.json();
      
      if (result.success) {
        showToast('업무가 삭제되었습니다.', 'info');
        refreshData();
      } else {
        showToast(result.error || '삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  // 태스크 날짜 이동
  const handleMoveTask = async (taskId: string, newDate: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: new Date(newDate).toISOString() }),
      });
      const result = await res.json();
      
      if (result.success) {
        showToast('업무가 이동되었습니다.', 'success');
        refreshData();
      }
    } catch (error) {
      showToast('이동에 실패했습니다.', 'error');
    }
  };

  // 캘린더에서 날짜 클릭 시 해당 날짜로 업무 추가
  const handleAddTaskOnDate = (date: string) => {
    setSelectedDate(date);
    setShowForm(true);
  };

  // 오늘로 이관
  const handleMoveToToday = async (taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    await handleMoveTask(taskId, today);
  };

  // 전체 오늘로 이관
  const handleMoveAllToToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await Promise.all(
        overdueTasks.map(task => 
          fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ due_date: new Date(today).toISOString() }),
          })
        )
      );
      showToast(`${overdueTasks.length}개 업무가 오늘로 이관되었습니다.`, 'success');
      setShowOverdueModal(false);
      refreshData();
    } catch (error) {
      showToast('이관에 실패했습니다.', 'error');
    }
  };

  // 오늘 미완료 업무 내일로 이관
  const handleMoveIncompleteTodayToTomorrow = async () => {
    const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0];
    
    if (incompleteTodayTasks.length === 0) {
      showToast('이관할 업무가 없습니다.', 'info');
      return;
    }

    if (!confirm(`${incompleteTodayTasks.length}개의 미완료 업무를 내일로 이관하시겠습니까?`)) return;
    
    try {
      await Promise.all(
        incompleteTodayTasks.map(task => 
          fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ due_date: new Date(tomorrow).toISOString() }),
          })
        )
      );
      showToast(`${incompleteTodayTasks.length}개 업무가 내일로 이관되었습니다.`, 'success');
      refreshData();
    } catch (error) {
      showToast('이관에 실패했습니다.', 'error');
    }
  };

  // 메모 저장
  const handleSaveMemo = async (content: string) => {
    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const result = await res.json();
      
      if (result.success) {
        showToast('메모가 저장되었습니다.', 'success');
        fetchMemos();
      } else {
        showToast(result.error || '메모 저장에 실패했습니다.', 'error');
      }
    } catch (error) {
      showToast('메모 저장에 실패했습니다.', 'error');
    }
  };

  // 메모 삭제
  const handleDeleteMemo = async (id: string) => {
    try {
      const res = await fetch(`/api/memos/${id}`, { method: 'DELETE' });
      const result = await res.json();
      
      if (result.success) {
        setMemos(memos.filter(m => m.id !== id));
        showToast('메모가 삭제되었습니다.', 'info');
      }
    } catch (error) {
      showToast('메모 삭제에 실패했습니다.', 'error');
    }
  };

  // 카카오 연결
  const handleKakaoConnect = async () => {
    try {
      const res = await fetch('/api/auth/kakao');
      const data = await res.json();
      if (data.success) {
        window.location.href = data.data.authUrl;
      }
    } catch (error) {
      showToast('카카오 연결에 실패했습니다.', 'error');
    }
  };

  // 알림 토글
  const handleToggleNotification = async () => {
    try {
      const res = await fetch('/api/notification/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isNotificationActive }),
      });
      const result = await res.json();
      
      if (result.success) {
        setIsNotificationActive(!isNotificationActive);
        showToast(
          !isNotificationActive ? '알림이 활성화되었습니다.' : '알림이 비활성화되었습니다.',
          'info'
        );
      }
    } catch (error) {
      showToast('설정 변경에 실패했습니다.', 'error');
    }
  };

  // 테스트 알림
  const handleTestNotification = async () => {
    try {
      const res = await fetch('/api/notification/test', { method: 'POST' });
      const result = await res.json();
      
      if (result.success) {
        showToast('테스트 메시지가 전송되었습니다!', 'success');
      } else {
        showToast(result.error || '전송에 실패했습니다.', 'error');
      }
    } catch (error) {
      showToast('전송에 실패했습니다.', 'error');
    }
  };

  // 새로고침
  const handleRefresh = async () => {
    setIsLoading(true);
    await refreshData();
    setIsLoading(false);
    showToast('새로고침 완료!', 'info');
  };

  return (
    <main className="min-h-screen pb-20 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-900 p-2 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">업무 리마인더</h1>
                <p className="text-xs text-gray-500">할 일 관리 & 카카오톡 알림</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 뷰 모드 전환 */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="리스트 보기"
                >
                  <List className={`w-4 h-4 ${viewMode === 'list' ? 'text-gray-900' : 'text-gray-500'}`} />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'calendar' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="캘린더 보기"
                >
                  <Calendar className={`w-4 h-4 ${viewMode === 'calendar' ? 'text-gray-900' : 'text-gray-500'}`} />
                </button>
              </div>
              
              <button 
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="새로고침"
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">추가</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 대시보드 */}
        <section className="mb-6">
          <Dashboard stats={stats} />
        </section>

        {/* 캘린더 뷰 */}
        {viewMode === 'calendar' ? (
          <div className="space-y-4">
            {/* 오늘 미완료 업무 일괄 이관 바 */}
            <BulkActionBar
              incompleteTodayCount={incompleteTodayTasks.length}
              onMoveToTomorrow={handleMoveIncompleteTodayToTomorrow}
            />
            
            <CalendarView
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onMoveTask={handleMoveTask}
              onEditTask={setEditingTask}
              onAddTask={handleAddTaskOnDate}
            />
          </div>
        ) : (
          /* 리스트 뷰 */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 업무 목록 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 오늘 미완료 업무 일괄 이관 바 */}
              <BulkActionBar
                incompleteTodayCount={incompleteTodayTasks.length}
                onMoveToTomorrow={handleMoveIncompleteTodayToTomorrow}
              />
              
              {/* 필터 */}
              <FilterBar
                priorityFilter={priorityFilter}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onPriorityFilterChange={(v) => handleFilterChange(v)}
                onSortChange={(v) => handleFilterChange(undefined, v)}
                onSortOrderChange={(v) => handleFilterChange(undefined, undefined, v)}
              />

              {/* 업무 목록 */}
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">로딩중...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="bg-white rounded-xl p-10 text-center border border-gray-200">
                    <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ListTodo className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-700 mb-1">업무가 없습니다</h3>
                    <p className="text-gray-500 text-sm mb-4">새로운 업무를 추가해보세요</p>
                    <button 
                      onClick={() => setShowForm(true)}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      업무 추가
                    </button>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onEdit={setEditingTask}
                      onDelete={handleDeleteTask}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 오른쪽: 사이드바 */}
            <div className="space-y-4">
              {/* 카카오톡 연결 */}
              <KakaoConnect
                isConnected={isKakaoConnected}
                isActive={isNotificationActive}
                onConnect={handleKakaoConnect}
                onToggleActive={handleToggleNotification}
                onTestNotification={handleTestNotification}
              />

              {/* 알림 안내 */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-3 text-sm">알림 안내</h3>
                <ul className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    매일 오전 9시 - 오늘 할 일 알림
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    매일 오후 6시 - 미완료 업무 체크
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    "~~ 했나요?" 형태로 리마인드
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 모달: 업무 추가/수정 */}
      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          defaultDate={selectedDate || undefined}
          onSubmit={handleSubmitTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
            setSelectedDate(null);
          }}
        />
      )}

      {/* 모달: 미완료 업무 (어제 이전) */}
      {showOverdueModal && (
        <OverdueTasksModal
          tasks={overdueTasks}
          onClose={() => setShowOverdueModal(false)}
          onMoveToToday={handleMoveToToday}
          onMoveAllToToday={handleMoveAllToToday}
          onComplete={async (taskId) => {
            await handleToggleComplete(tasks.find(t => t.id === taskId)!);
          }}
          onDelete={handleDeleteTask}
        />
      )}

      {/* 메모 플로팅 버튼 */}
      <MemoButton
        onSave={handleSaveMemo}
        recentMemos={memos}
        onDeleteMemo={handleDeleteMemo}
      />

      {/* 토스트 알림 */}
      <div className="fixed bottom-4 right-24 space-y-2 z-50">
        {toasts.map((toast: ToastData) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </main>
  );
}
