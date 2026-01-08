-- PostgreSQL Schema for Sidekick Eval
-- Run this to initialize the database

-- Runs table
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  test_type TEXT NOT NULL DEFAULT 'ai-generated-iteration',
  format TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  state TEXT NOT NULL DEFAULT 'scored', -- 'capturing', 'captured', 'scored'
  rating TEXT, -- 'bad', 'good', 'great' (null for non-scored)
  scores JSONB, -- {overall, promptAdherence, iterationQuality}
  good TEXT[] DEFAULT '{}',
  bad TEXT[] DEFAULT '{}',
  summary TEXT,
  issues JSONB, -- [{severity, text}]
  iteration_analysis JSONB, -- {v1ToV2, v2ToV3, regressions}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id SERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  artifact TEXT,
  -- For capture prompts
  observation TEXT,
  captured_at TIMESTAMPTZ,
  -- For scored prompts
  status TEXT, -- 'pass', 'warning', 'fail'
  note TEXT,
  evaluation JSONB, -- VisualEvaluation object
  UNIQUE(run_id, number)
);

-- Annotations table (supports multiple annotations per prompt)
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  prompt_number INTEGER NOT NULL,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'high', 'medium', 'low'
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Note: No unique constraint - allows multiple annotations per prompt
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_runs_format ON runs(format);
CREATE INDEX IF NOT EXISTS idx_runs_test_type ON runs(test_type);
CREATE INDEX IF NOT EXISTS idx_runs_state ON runs(state);
CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_run_id ON prompts(run_id);
CREATE INDEX IF NOT EXISTS idx_annotations_run_id ON annotations(run_id);
