-- 보류 업무(on_hold) 상태 추가 마이그레이션
-- Supabase 대시보드 > SQL Editor에서 한 번 실행하세요.
-- (기존 tasks 테이블의 status CHECK 제약에 'on_hold'를 허용하도록 교체)

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'on_hold'));
