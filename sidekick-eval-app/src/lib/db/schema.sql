-- PostgreSQL Schema for Sidekick Eval
-- Run this to initialize the database

-- Runs table
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  name TEXT, -- Human-readable name/description of the test goal
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

-- Prompts table (legacy, kept for backward compatibility)
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
  response TEXT, -- Sidekick's text response (chat-like UI)
  UNIQUE(run_id, number)
);

-- Messages table (new message-based conversation structure)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  message_id INTEGER NOT NULL, -- Sequential ID within the run
  role TEXT NOT NULL, -- 'user', 'agent', 'context'
  text TEXT NOT NULL,
  artifact TEXT, -- Path to artifact (only for agent messages)
  context_preview TEXT, -- Thumbnail for context messages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(run_id, message_id)
);

-- Planned fixes table (for grouping issues by solution)
CREATE TABLE IF NOT EXISTS planned_fixes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  jira_ticket TEXT,
  owner TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annotations table (supports multiple annotations per message)
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  message_id INTEGER NOT NULL, -- ID of the message being annotated
  prompt_number INTEGER NOT NULL, -- Legacy: kept for backward compatibility
  author TEXT NOT NULL DEFAULT 'human', -- 'frank' or 'human'
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'good', 'high', 'medium', 'low'
  note TEXT DEFAULT '',
  planned_fix_id TEXT REFERENCES planned_fixes(id) ON DELETE SET NULL,
  -- Annotation target fields (simplified)
  target_type TEXT, -- 'message', 'image', or NULL (tags whole message)
  marker_x REAL, -- image marker x position (0-100 percentage)
  marker_y REAL, -- image marker y position (0-100 percentage)
  marker_label TEXT, -- optional marker label (e.g., "1", "A")
  -- Legacy fields (deprecated, kept for backward compat)
  content_type TEXT,
  start_offset INTEGER,
  end_offset INTEGER,
  highlighted_text TEXT,
  owner TEXT, -- annotation owner
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Note: No unique constraint - allows multiple annotations per message
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_runs_format ON runs(format);
CREATE INDEX IF NOT EXISTS idx_runs_test_type ON runs(test_type);
CREATE INDEX IF NOT EXISTS idx_runs_state ON runs(state);
CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_run_id ON prompts(run_id);
CREATE INDEX IF NOT EXISTS idx_messages_run_id ON messages(run_id);
CREATE INDEX IF NOT EXISTS idx_annotations_run_id ON annotations(run_id);
CREATE INDEX IF NOT EXISTS idx_annotations_message_id ON annotations(run_id, message_id);
CREATE INDEX IF NOT EXISTS idx_annotations_planned_fix_id ON annotations(planned_fix_id);

-- Migration: Add planned_fix_id to existing annotations table
-- Run this if you have an existing database:
--
-- CREATE TABLE IF NOT EXISTS planned_fixes (
--   id TEXT PRIMARY KEY,
--   name TEXT NOT NULL,
--   jira_ticket TEXT,
--   owner TEXT,
--   resolved BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );
--
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS planned_fix_id TEXT REFERENCES planned_fixes(id) ON DELETE SET NULL;
-- CREATE INDEX IF NOT EXISTS idx_annotations_planned_fix_id ON annotations(planned_fix_id);
--
-- Migration: Add owner and resolved columns to planned_fixes
-- ALTER TABLE planned_fixes ADD COLUMN IF NOT EXISTS owner TEXT;
-- ALTER TABLE planned_fixes ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE;
--
-- Migration: Add name column to runs
-- ALTER TABLE runs ADD COLUMN IF NOT EXISTS name TEXT;
--
-- Migration: Add response column to prompts (for chat-like UI)
-- ALTER TABLE prompts ADD COLUMN IF NOT EXISTS response TEXT;
--
-- Migration: Add annotation target fields (text/image highlighting)
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS target_type TEXT;
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS content_type TEXT;
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS start_offset INTEGER;
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS end_offset INTEGER;
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS highlighted_text TEXT;
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS marker_x REAL;
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS marker_y REAL;
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS marker_label TEXT;
--
-- Migration: Add message-based conversation structure
-- CREATE TABLE IF NOT EXISTS messages (
--   id SERIAL PRIMARY KEY,
--   run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
--   message_id INTEGER NOT NULL,
--   role TEXT NOT NULL,
--   text TEXT NOT NULL,
--   artifact TEXT,
--   context_preview TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(run_id, message_id)
-- );
-- CREATE INDEX IF NOT EXISTS idx_messages_run_id ON messages(run_id);
-- ALTER TABLE annotations ADD COLUMN IF NOT EXISTS message_id INTEGER;
-- UPDATE annotations SET message_id = prompt_number WHERE message_id IS NULL;
-- ALTER TABLE annotations ALTER COLUMN message_id SET NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_annotations_message_id ON annotations(run_id, message_id);
