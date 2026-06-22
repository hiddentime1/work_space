import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 클라이언트 사이드용 (환경변수 없으면 null)
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

// 서버 사이드용 클라이언트 (Service Role Key 사용)
// 요청마다 새로 만들지 않고 모듈 싱글톤으로 재사용 → warm 인스턴스에서 연결/핸드셰이크 비용 절감.
let serverClient: SupabaseClient | null = null;

export const createServerSupabaseClient = (): SupabaseClient | null => {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  // 서버에서는 세션 유지/자동 토큰 갱신이 불필요 → 비활성화로 오버헤드 제거
  serverClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serverClient;
};
