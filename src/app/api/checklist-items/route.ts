import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ChecklistItem, CreateChecklistItemInput } from '@/types';

export const dynamic = 'force-dynamic';

// GET - 모든 체크리스트 항목 조회
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<ChecklistItem[]>>({
        success: true,
        data: []
      });
    }

    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<ChecklistItem[]>>({
      success: true,
      data: data as ChecklistItem[]
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// POST - 새 체크리스트 항목 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    const body: CreateChecklistItemInput = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '제목은 필수입니다.'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        emoji: body.emoji || '✅',
        sort_order: body.sort_order ?? 0,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<ChecklistItem>>({
      success: true,
      data: data as ChecklistItem,
      message: '체크리스트 항목이 추가되었습니다.'
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
