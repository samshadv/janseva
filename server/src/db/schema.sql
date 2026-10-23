-- =============================================
-- JanSetu AI — Phase 2 Database Schema
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- =============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILES TABLE
-- Extends auth.users with JanSetu citizen preferences
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT        NOT NULL,
  display_name        TEXT,
  preferred_state     TEXT        DEFAULT 'Not specified',
  preferred_language  TEXT        DEFAULT 'English',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CONVERSATIONS TABLE
-- Stores every citizen query + AI structured guidance
CREATE TABLE IF NOT EXISTS public.conversations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query               TEXT        NOT NULL,
  state               TEXT        DEFAULT 'Not specified',
  language            TEXT        DEFAULT 'English',
  response            JSONB       NOT NULL,
  service_category    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user history lookup
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_created
  ON public.conversations (user_id, created_at DESC);

-- 4. FEEDBACK TABLE
-- Thumbs up/down per conversation
CREATE TABLE IF NOT EXISTS public.feedback (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating              SMALLINT    NOT NULL CHECK (rating IN (1, -1)), -- 1=helpful, -1=not helpful
  comment             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, user_id)
);

-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback      ENABLE ROW LEVEL SECURITY;

-- user_profiles: users can read & update only their own row
CREATE POLICY "Users manage own profile"
  ON public.user_profiles FOR ALL
  USING (auth.uid() = id);

-- conversations: users can read only their own
CREATE POLICY "Users read own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

-- conversations: service role inserts
CREATE POLICY "Service role inserts conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (TRUE);

-- feedback: users manage their own feedback
CREATE POLICY "Users manage own feedback"
  ON public.feedback FOR ALL
  USING (auth.uid() = user_id);

-- 6. TRIGGER FOR AUTOMATIC PROFILE CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
