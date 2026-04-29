import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ChecklistItemWithStatus } from '@/types';

export const dynamic = 'force-dynamic';

// GET - 특정 날짜의 체크리스트 (활성 항목 + 해당 날짜 체크 상태)
// query: ?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<ChecklistItemWithStatus[]>>({
        success: true,
        data: []
      });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'date 파라미터가 필요합니다.'
      }, { status: 400 });
    }

    // 활성 체크리스트 항목 조회
    const { data: items, error: itemsError } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (itemsError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: itemsError.message
      }, { status: 500 });
    }

    // 해당 날짜의 체크 기록 조회
    const { data: checks, error: checksError } = await supabase
      .from('daily_checklists')
      .select('*')
      .eq('check_date', date);

    if (checksError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: checksError.message
      }, { status: 500 });
    }

    const checkMap = new Map(
      (checks || []).map(c => [c.item_id, c])
    );

    const result: ChecklistItemWithStatus[] = (items || []).map(item => {
      const check = checkMap.get(item.id);
      return {
        ...item,
        is_checked: check?.is_checked ?? false,
        checked_at: check?.checked_at,
        daily_id: check?.id,
      };
    });

    return NextResponse.json<ApiResponse<ChecklistItemWithStatus[]>>({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// POST - 특정 날짜에 항목 체크 토글 (upsert)
// body: { date: 'YYYY-MM-DD', item_id: string, is_checked: boolean }
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    const body = await request.json();
    const { date, item_id, is_checked } = body;

    if (!date || !item_id || typeof is_checked !== 'boolean') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'date, item_id, is_checked가 필요합니다.'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('daily_checklists')
      .upsert(
        {
          check_date: date,
          item_id,
          is_checked,
          checked_at: is_checked ? new Date().toISOString() : null,
        },
        { onConflict: 'check_date,item_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<typeof data>>({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
