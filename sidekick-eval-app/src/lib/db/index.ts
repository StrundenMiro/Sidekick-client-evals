import { Pool, PoolClient } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For Replit, we might need SSL
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Test connection on startup
pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

// Query helper with automatic client management
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// For single row queries
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

// Transaction helper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Initialize schema
export async function initializeSchema(): Promise<void> {
  const schema = `
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      test_type TEXT NOT NULL DEFAULT 'ai-generated-iteration',
      format TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      state TEXT NOT NULL DEFAULT 'scored',
      rating TEXT,
      scores JSONB,
      good TEXT[] DEFAULT '{}',
      bad TEXT[] DEFAULT '{}',
      summary TEXT,
      issues JSONB,
      iteration_analysis JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id SERIAL PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      artifact TEXT,
      observation TEXT,
      captured_at TIMESTAMPTZ,
      status TEXT,
      note TEXT,
      evaluation JSONB,
      UNIQUE(run_id, number)
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      prompt_number INTEGER NOT NULL,
      issue_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(run_id, prompt_number)
    );

    CREATE INDEX IF NOT EXISTS idx_runs_format ON runs(format);
    CREATE INDEX IF NOT EXISTS idx_runs_test_type ON runs(test_type);
    CREATE INDEX IF NOT EXISTS idx_runs_state ON runs(state);
    CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_prompts_run_id ON prompts(run_id);
    CREATE INDEX IF NOT EXISTS idx_annotations_run_id ON annotations(run_id);
  `;

  await pool.query(schema);
  console.log('Database schema initialized');
}

// Check if using database or fallback to JSON
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export default pool;
