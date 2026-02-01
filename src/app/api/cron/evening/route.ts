import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendKakaoMessage, refreshKakaoToken, formatEveningReminder } from '@/lib/kakao';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

// Vercel Cron에서 호출 - 저녁 리마인더 (미완료 체크)
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증 확인
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ success: false, message: 'Database not configured' });
    }

    // 알림 설정 조회
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError || !settings?.is_active || !settings?.kakao_access_token) {
      return NextResponse.json({ 
        success: false, 
        message: '알림이 비활성화되었거나 카카오톡이 연결되지 않았습니다.' 
      });
    }

    // 오늘 미완료 업무 조회
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();

    const { data: incompleteTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('title, priority')
      .neq('status', 'completed')
      .or(`due_date.gte.${todayStart},due_date.lte.${todayEnd},due_date.is.null`)
      .order('priority', { ascending: true });

    if (tasksError) {
      console.error('태스크 조회 실패:', tasksError);
      return NextResponse.json({ success: false, error: tasksError.message });
    }

    // 메시지 생성 및 전송
    const message = formatEveningReminder(incompleteTasks || []);
    let accessToken = settings.kakao_access_token;
    let success = await sendKakaoMessage(accessToken, message);

    // 실패 시 토큰 갱신 후 재시도
    if (!success && settings.kakao_refresh_token) {
      try {
        const newTokenData = await refreshKakaoToken(settings.kakao_refresh_token);
        
        if (newTokenData) {
          await supabase
            .from('notification_settings')
            .update({
              kakao_access_token: newTokenData.access_token,
              kakao_refresh_token: newTokenData.refresh_token || settings.kakao_refresh_token,
            })
            .eq('id', settings.id);

          success = await sendKakaoMessage(newTokenData.access_token, message);
        }
      } catch (refreshError) {
        console.error('토큰 갱신 실패:', refreshError);
      }
    }

    // 알림 로그 저장
    await supabase
      .from('notification_logs')
      .insert({
        notification_type: 'evening',
        is_success: success,
        error_message: success ? null : '메시지 전송 실패'
      });

    return NextResponse.json({ 
      success, 
      message: success ? '저녁 리마인더 전송 완료' : '전송 실패',
      incompleteCount: incompleteTasks?.length || 0
    });

  } catch (error) {
    console.error('저녁 리마인더 크론 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
