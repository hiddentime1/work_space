-- Supabase에서 실행할 SQL 스키마
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- Tasks 테이블
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  reminder_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_reminded BOOLEAN DEFAULT FALSE,
  category TEXT
);

-- Notification Settings 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  morning_reminder_time TIME DEFAULT '09:00',
  evening_reminder_time TIME DEFAULT '18:00',
  kakao_access_token TEXT,
  kakao_refresh_token TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 로그 테이블 (발송 이력 관리)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN ('morning', 'evening', 'due_soon', 'overdue')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  is_success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

-- 메모 테이블
CREATE TABLE IF NOT EXISTS memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memos 테이블 트리거
DROP TRIGGER IF EXISTS update_memos_updated_at ON memos;
CREATE TRIGGER update_memos_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 메모 인덱스
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at DESC);

-- 거래처 연락 테이블
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_date DATE NOT NULL,
  content TEXT,
  contact_person TEXT,
  phone TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Contacts 테이블 트리거
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Contacts 인덱스
CREATE INDEX IF NOT EXISTS idx_contacts_contact_date ON contacts(contact_date);
CREATE INDEX IF NOT EXISTS idx_contacts_is_completed ON contacts(is_completed);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tasks 테이블 트리거
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notification Settings 테이블 트리거
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- RLS (Row Level Security) 설정 - 필요시 활성화
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 기본 notification_settings 레코드 생성
INSERT INTO notification_settings (morning_reminder_time, evening_reminder_time, is_active)
VALUES ('09:00', '18:00', true)
ON CONFLICT DO NOTHING;
