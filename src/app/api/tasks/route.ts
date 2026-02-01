import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { CreateTaskInput, ApiResponse, Task } from '@/types';

// GET - 모든 태스크 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let query = supabase
      .from('tasks')
      .select('*');

    // 필터 적용
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    // 정렬 적용
    const ascending = sortOrder === 'asc';
    if (sortBy === 'priority') {
      // 우선순위 정렬: urgent > high > medium > low
      query = query.order('priority', { ascending });
    } else {
      query = query.order(sortBy, { ascending, nullsFirst: false });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // 지연된 태스크 상태 업데이트
    const now = new Date();
    const updatedData = data?.map(task => {
      if (task.due_date && task.status !== 'completed') {
        const dueDate = new Date(task.due_date);
        if (dueDate < now) {
          return { ...task, status: 'overdue' };
        }
      }
      return task;
    });

    return NextResponse.json<ApiResponse<Task[]>>({
      success: true,
      data: updatedData as Task[]
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// POST - 새 태스크 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body: CreateTaskInput = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '제목은 필수입니다.'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        priority: body.priority || 'medium',
        due_date: body.due_date || null,
        reminder_time: body.reminder_time || null,
        category: body.category?.trim() || null,
        status: 'pending',
        is_reminded: false
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Task>>({
      success: true,
      data: data as Task,
      message: '업무가 추가되었습니다.'
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
