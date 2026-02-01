import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, DashboardStats } from '@/types';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET - 대시보드 통계 조회
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<DashboardStats>>({
        success: true,
        data: { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0, completedToday: 0, dueToday: 0 }
      });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();

    // 통계 계산
    const stats: DashboardStats = {
      total: tasks?.length || 0,
      pending: tasks?.filter(t => t.status === 'pending').length || 0,
      in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
      completed: tasks?.filter(t => t.status === 'completed').length || 0,
      overdue: tasks?.filter(t => {
        if (t.status === 'completed') return false;
        if (!t.due_date) return false;
        return new Date(t.due_date) < now;
      }).length || 0,
      completedToday: tasks?.filter(t => {
        if (!t.completed_at) return false;
        return t.completed_at >= todayStart && t.completed_at <= todayEnd;
      }).length || 0,
      dueToday: tasks?.filter(t => {
        if (t.status === 'completed') return false;
        if (!t.due_date) return false;
        const dueDate = t.due_date;
        return dueDate >= todayStart && dueDate <= todayEnd;
      }).length || 0,
    };

    return NextResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: stats
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
