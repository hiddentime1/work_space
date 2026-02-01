import { KakaoTokenResponse } from '@/types';

const KAKAO_API_URL = 'https://kapi.kakao.com';
const KAKAO_AUTH_URL = 'https://kauth.kakao.com';

// 카카오 로그인 URL 생성
export function getKakaoAuthUrl() {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return null;
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'talk_message',
  });

  return `${KAKAO_AUTH_URL}/oauth/authorize?${params.toString()}`;
}

// 인가 코드로 액세스 토큰 발급
export async function getKakaoToken(code: string): Promise<KakaoTokenResponse | null> {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  const response = await fetch(`${KAKAO_AUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || '토큰 발급 실패');
  }

  return response.json();
}

// 리프레시 토큰으로 액세스 토큰 갱신
export async function refreshKakaoToken(refreshToken: string): Promise<KakaoTokenResponse | null> {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await fetch(`${KAKAO_AUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || '토큰 갱신 실패');
  }

  return response.json();
}

// 나에게 카카오톡 메시지 보내기
export async function sendKakaoMessage(accessToken: string, message: string): Promise<boolean> {
  const templateObject = {
    object_type: 'text',
    text: message,
    link: {
      web_url: process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
      mobile_web_url: process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
    },
    button_title: '업무 확인하기',
  };

  const response = await fetch(`${KAKAO_API_URL}/v2/api/talk/memo/default/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({
      template_object: JSON.stringify(templateObject),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('카카오 메시지 전송 실패:', error);
    return false;
  }

  return true;
}

// 리마인더 메시지 포맷팅
export function formatMorningReminder(tasks: Array<{ title: string; due_date?: string; priority: string }>) {
  const today = new Date().toLocaleDateString('ko-KR', { 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  });

  let message = `📋 ${today}\n오늘의 업무 리마인더\n\n`;

  if (tasks.length === 0) {
    message += '✨ 오늘 예정된 업무가 없어요!\n편안한 하루 보내세요.';
    return message;
  }

  const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
  const normalTasks = tasks.filter(t => t.priority !== 'urgent' && t.priority !== 'high');

  if (urgentTasks.length > 0) {
    message += '🔥 긴급/중요 업무\n';
    urgentTasks.forEach(task => {
      message += `  • ${task.title}\n`;
    });
    message += '\n';
  }

  if (normalTasks.length > 0) {
    message += '📝 일반 업무\n';
    normalTasks.forEach(task => {
      message += `  • ${task.title}\n`;
    });
  }

  message += `\n총 ${tasks.length}개의 업무가 있어요!`;
  return message;
}

// 저녁 리마인더 (미완료 체크)
export function formatEveningReminder(incompleteTasks: Array<{ title: string; priority: string }>) {
  let message = `📋 저녁 업무 체크\n\n`;

  if (incompleteTasks.length === 0) {
    message += '🎉 오늘 업무를 모두 완료했어요!\n수고하셨습니다. 푹 쉬세요!';
    return message;
  }

  message += '아직 완료하지 않은 업무가 있어요:\n\n';
  incompleteTasks.forEach(task => {
    const emoji = task.priority === 'urgent' ? '🚨' : task.priority === 'high' ? '⚠️' : '📌';
    message += `${emoji} "${task.title}" 완료하셨나요?\n`;
  });

  message += `\n총 ${incompleteTasks.length}개 남았어요.`;
  return message;
}

// 지연 알림 메시지
export function formatOverdueReminder(overdueTasks: Array<{ title: string; due_date?: string }>) {
  let message = `⏰ 지연된 업무 알림\n\n`;

  message += '마감일이 지난 업무가 있어요:\n\n';
  overdueTasks.forEach(task => {
    message += `🚨 ${task.title}\n`;
  });

  message += `\n빠른 확인 부탁드려요!`;
  return message;
}
