-- 업무 유형(task_type) 추가 마이그레이션
-- Supabase 대시보드 > SQL Editor에서 한 번 실행하세요.
-- task: 일반 업무, meeting: 미팅 (날짜별로 미팅 층/업무 층을 분리 표기)

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'task'
  CHECK (task_type IN ('task', 'meeting'));

-- 기존 행은 모두 일반 업무로 처리
UPDATE tasks SET task_type = 'task' WHERE task_type IS NULL;
