import { NextRequest, NextResponse } from 'next/server';
import { getKakaoToken } from '@/lib/kakao';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET - 카카오 콜백 처리
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '/';
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${appUrl}?kakao_error=${error}`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}?kakao_error=no_code`);
    }

    // 토큰 발급
    const tokenData = await getKakaoToken(code);
    
    if (!tokenData) {
      return NextResponse.redirect(`${appUrl}?kakao_error=token_failed`);
    }
    
    // Supabase에 토큰 저장
    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.redirect(`${appUrl}?kakao_error=db_not_configured`);
    }
    
    // 기존 설정이 있으면 업데이트, 없으면 생성
    const { data: existing } = await supabase
      .from('notification_settings')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from('notification_settings')
        .update({
          kakao_access_token: tokenData.access_token,
          kakao_refresh_token: tokenData.refresh_token,
          is_active: true,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('notification_settings')
        .insert({
          kakao_access_token: tokenData.access_token,
          kakao_refresh_token: tokenData.refresh_token,
          is_active: true,
        });
    }

    // 성공 시 메인 페이지로 리다이렉트
    return NextResponse.redirect(`${appUrl}?kakao_connected=true`);

  } catch (error) {
    console.error('카카오 콜백 에러:', error);
    return NextResponse.redirect(`${appUrl}?kakao_error=token_failed`);
  }
}
