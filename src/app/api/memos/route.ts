import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { CreateMemoInput, ApiResponse, Memo } from '@/types';

export const dynamic = 'force-dynamic';

// GET - 모든 메모 조회
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<Memo[]>>({
        success: true,
        data: []
      });
    }

    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Memo[]>>({
      success: true,
      data: data as Memo[]
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// POST - 새 메모 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    const body: CreateMemoInput = await request.json();

    if (!body.content?.trim()) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '내용은 필수입니다.'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('memos')
      .insert({
        content: body.content.trim()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Memo>>({
      success: true,
      data: data as Memo,
      message: '메모가 저장되었습니다.'
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
