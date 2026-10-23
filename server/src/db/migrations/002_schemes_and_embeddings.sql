-- =============================================
-- JanSetu AI — Phase 3 Database Migration
-- pgvector Extension & Official Schemes Table
-- =============================================

-- 1. Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create official_schemes table
CREATE TABLE IF NOT EXISTS public.official_schemes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  ministry_or_dept    TEXT NOT NULL,
  level               TEXT NOT NULL CHECK (level IN ('Central', 'State', 'Central_Sponsored')),
  applicable_states   TEXT[] DEFAULT ARRAY['All'],
  category            TEXT NOT NULL,
  summary             TEXT NOT NULL,
  eligibility_rules   JSONB NOT NULL,
  required_documents  TEXT[] NOT NULL,
  official_portal     TEXT NOT NULL,
  application_steps   TEXT[] NOT NULL,
  embedding           vector(768),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Vector cosine similarity index
CREATE INDEX IF NOT EXISTS idx_schemes_embedding 
  ON public.official_schemes 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 20);

-- 4. Fast scheme matcher stored procedure
CREATE OR REPLACE FUNCTION match_schemes(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.60,
  match_count int DEFAULT 4,
  filter_state text DEFAULT 'All'
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  title TEXT,
  ministry_or_dept TEXT,
  category TEXT,
  summary TEXT,
  official_portal TEXT,
  required_documents TEXT[],
  application_steps TEXT[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.code,
    s.title,
    s.ministry_or_dept,
    s.category,
    s.summary,
    s.official_portal,
    s.required_documents,
    s.application_steps,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM public.official_schemes s
  WHERE (s.embedding IS NOT NULL)
    AND (1 - (s.embedding <=> query_embedding) > match_threshold)
    AND (filter_state = 'All' OR 'All' = ANY(s.applicable_states) OR filter_state = ANY(s.applicable_states))
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
