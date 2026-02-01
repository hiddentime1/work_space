import { NextResponse } from 'next/server';
import { getKakaoAuthUrl } from '@/lib/kakao';

// GET - 카카오 로그인 URL 반환
export async function GET() {
  try {
    const authUrl = getKakaoAuthUrl();
    
    return NextResponse.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '카카오 인증 URL 생성 실패'
    }, { status: 500 });
  }
}
