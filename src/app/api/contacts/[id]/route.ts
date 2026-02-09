import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { UpdateContactInput, ApiResponse, Contact } from '@/types';

export const dynamic = 'force-dynamic';

// GET - 특정 거래처 연락 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<Contact>>({
      success: true,
      data: data as Contact
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// PATCH - 거래처 연락 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    const body: UpdateContactInput = await request.json();
    
    // 업데이트할 필드 구성
    const updateData: Record<string, any> = {};
    
    if (body.company_name !== undefined) {
      updateData.company_name = body.company_name.trim();
    }
    if (body.contact_date !== undefined) {
      updateData.contact_date = body.contact_date;
    }
    if (body.content !== undefined) {
      updateData.content = body.content?.trim() || null;
    }
    if (body.contact_person !== undefined) {
      updateData.contact_person = body.contact_person?.trim() || null;
    }
    if (body.phone !== undefined) {
      updateData.phone = body.phone?.trim() || null;
    }
    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }
    if (body.is_completed !== undefined) {
      updateData.is_completed = body.is_completed;
      if (body.is_completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', params.id)
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
      message: '거래처 연락이 수정되었습니다.'
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// DELETE - 거래처 연락 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '거래처 연락이 삭제되었습니다.'
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
