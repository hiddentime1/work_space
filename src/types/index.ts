// Task 상태 타입
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

// 우선순위 타입
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Task 인터페이스
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  due_date?: string;
  reminder_time?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  is_reminded: boolean;
  category?: string;
}

// Task 생성 시 필요한 타입
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: Priority;
  due_date?: string;
  reminder_time?: string;
  category?: string;
}

// Task 수정 시 필요한 타입
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  due_date?: string;
  reminder_time?: string;
  category?: string;
  is_reminded?: boolean;
}

// 카카오톡 알림 설정
export interface NotificationSettings {
  id: string;
  morning_reminder_time: string;  // "09:00"
  evening_reminder_time: string;  // "18:00"
  kakao_access_token?: string;
  kakao_refresh_token?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 카카오 토큰 응답
export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in: number;
  scope?: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 대시보드 통계
export interface DashboardStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  completedToday: number;
  dueToday: number;
}

// 메모 인터페이스
export interface Memo {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// 메모 생성 타입
export interface CreateMemoInput {
  content: string;
}

// 메모 수정 타입
export interface UpdateMemoInput {
  content?: string;
}
