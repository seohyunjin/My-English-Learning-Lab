-- ================================================
-- English Learning Lab — Supabase DB Schema
-- Supabase 대시보드 > SQL Editor에 붙여넣고 실행하세요
-- ================================================

-- 대화 세션 테이블
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  topic TEXT,
  chat_log JSONB DEFAULT '[]',
  corrections_count INT DEFAULT 0,
  key_expressions JSONB DEFAULT '[]',
  score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 개인 단어장 테이블
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  meaning TEXT,
  example TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 비활성화 (개인 프로젝트용 — 나중에 로그인 추가 시 활성화)
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary DISABLE ROW LEVEL SECURITY;
