import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { CreateContactInput, ApiResponse, Contact } from '@/types';

export const dynamic = 'force-dynamic';

// GET - 모든 거래처 연락 조회 (날짜 필터 가능)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<Contact[]>>({
        success: true,
        data: []
      });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const showCompleted = searchParams.get('showCompleted') === 'true';

    let query = supabase
      .from('contacts')
      .select('*')
      .order('contact_date', { ascending: true })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // 날짜 필터
    if (startDate) {
      query = query.gte('contact_date', startDate);
    }
    if (endDate) {
      query = query.lte('contact_date', endDate);
    }

    // 완료 여부 필터
    if (!showCompleted) {
      query = query.eq('is_completed', false);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Contact[]>>({
      success: true,
      data: data as Contact[]
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// POST - 새 거래처 연락 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    const body: CreateContactInput = await request.json();

    if (!body.company_name?.trim()) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '거래처명은 필수입니다.'
      }, { status: 400 });
    }

    if (!body.contact_date) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '연락 날짜는 필수입니다.'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        company_name: body.company_name.trim(),
        contact_date: body.contact_date,
        content: body.content?.trim() || null,
        contact_person: body.contact_person?.trim() || null,
        phone: body.phone?.trim() || null,
        priority: body.priority || 'medium',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Contact>>({
      success: true,
      data: data as Contact,
      message: '거래처 연락이 등록되었습니다.'
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
