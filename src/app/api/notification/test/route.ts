import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendKakaoMessage, refreshKakaoToken } from '@/lib/kakao';
import { ApiResponse } from '@/types';

// POST - 테스트 메시지 전송
export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }
    
    // 알림 설정 조회
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !settings?.kakao_access_token) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '카카오톡이 연결되지 않았습니다.'
      }, { status: 400 });
    }

    let accessToken = settings.kakao_access_token;

    // 메시지 전송 시도
    const testMessage = `🔔 업무 리마인더 테스트\n\n카카오톡 알림이 정상적으로 연결되었습니다!\n\n앞으로 설정한 시간에 업무 리마인더를 받으실 수 있어요.`;
    
    let success = await sendKakaoMessage(accessToken, testMessage);

    // 실패 시 토큰 갱신 후 재시도
    if (!success && settings.kakao_refresh_token) {
      try {
        const newTokenData = await refreshKakaoToken(settings.kakao_refresh_token);
        
        if (newTokenData) {
          // 새 토큰 저장
          await supabase
            .from('notification_settings')
            .update({
              kakao_access_token: newTokenData.access_token,
              kakao_refresh_token: newTokenData.refresh_token || settings.kakao_refresh_token,
            })
            .eq('id', settings.id);

          // 재시도
          success = await sendKakaoMessage(newTokenData.access_token, testMessage);
        }
      } catch (refreshError) {
        console.error('토큰 갱신 실패:', refreshError);
      }
    }

    if (!success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '메시지 전송에 실패했습니다. 카카오톡을 다시 연결해주세요.'
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '테스트 메시지가 전송되었습니다.'
    });

  } catch (error) {
    console.error('테스트 메시지 전송 오류:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
