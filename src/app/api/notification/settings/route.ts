import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, NotificationSettings } from '@/types';

// GET - 알림 설정 조회
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: true,
        data: null
      });
    }
    
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // 토큰 정보는 클라이언트에 노출하지 않음
    const safeData = data ? {
      ...data,
      kakao_access_token: data.kakao_access_token ? '***connected***' : null,
      kakao_refresh_token: undefined,
    } : null;

    return NextResponse.json<ApiResponse<Partial<NotificationSettings> | null>>({
      success: true,
      data: safeData
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// PATCH - 알림 설정 수정
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }
    
    const body = await request.json();

    // 수정 가능한 필드만 추출
    const updateData: Partial<NotificationSettings> = {};
    if (body.morning_reminder_time !== undefined) {
      updateData.morning_reminder_time = body.morning_reminder_time;
    }
    if (body.evening_reminder_time !== undefined) {
      updateData.evening_reminder_time = body.evening_reminder_time;
    }
    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }

    // 기존 설정 조회
    const { data: existing } = await supabase
      .from('notification_settings')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from('notification_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('notification_settings')
        .insert(updateData)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: result.error.message
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<NotificationSettings>>({
      success: true,
      data: result.data as NotificationSettings,
      message: '설정이 저장되었습니다.'
    });

  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
