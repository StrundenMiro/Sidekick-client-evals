/**
 * Migration script to import existing JSON data into PostgreSQL
 *
 * Usage:
 *   DATABASE_URL=your-connection-string npx ts-node scripts/migrate-to-postgres.ts
 *
 * Or on Replit:
 *   npm run migrate
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Starting migration to PostgreSQL...\n');

  // Initialize schema
  console.log('1. Creating tables...');
  await pool.query(`
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
  `);
  console.log('   ✓ Tables created\n');

  // Import runs
  const runsPath = path.join(process.cwd(), 'data', 'runs.json');
  if (fs.existsSync(runsPath)) {
    console.log('2. Importing runs...');
    const runsData = JSON.parse(fs.readFileSync(runsPath, 'utf-8'));
    const runs = runsData.runs || [];

    let runCount = 0;
    let promptCount = 0;

    for (const run of runs) {
      const state = run.state || 'scored';
      const rating = run.rating || (run.scores ? (run.scores.overall >= 8 ? 'great' : run.scores.overall >= 5 ? 'good' : 'bad') : null);

      // Check if run already exists
      const existing = await pool.query('SELECT id FROM runs WHERE id = $1', [run.id]);
      if (existing.rows.length > 0) {
        console.log(`   Skipping existing run: ${run.id}`);
        continue;
      }

      await pool.query(`
        INSERT INTO runs (id, test_type, format, timestamp, state, rating, scores, good, bad, summary, issues, iteration_analysis)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        run.id,
        run.testType || 'ai-generated-iteration',
        run.format,
        run.timestamp,
        state,
        rating,
        run.scores ? JSON.stringify(run.scores) : null,
        run.good || [],
        run.bad || [],
        run.summary || null,
        run.issues ? JSON.stringify(run.issues) : null,
        run.iterationAnalysis ? JSON.stringify(run.iterationAnalysis) : null
      ]);
      runCount++;

      // Import prompts
      for (const prompt of run.prompts || []) {
        const isCapture = 'observation' in prompt;

        await pool.query(`
          INSERT INTO prompts (run_id, number, title, text, artifact, observation, captured_at, status, note, evaluation)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (run_id, number) DO NOTHING
        `, [
          run.id,
          prompt.number,
          prompt.title,
          prompt.text,
          prompt.artifact || null,
          isCapture ? prompt.observation : null,
          isCapture ? prompt.capturedAt : null,
          !isCapture ? prompt.status : null,
          !isCapture ? prompt.note : null,
          !isCapture && prompt.evaluation ? JSON.stringify(prompt.evaluation) : null
        ]);
        promptCount++;
      }
    }

    console.log(`   ✓ Imported ${runCount} runs with ${promptCount} prompts\n`);
  } else {
    console.log('2. No runs.json found, skipping runs import\n');
  }

  // Import annotations
  const annotationsPath = path.join(process.cwd(), 'data', 'annotations.json');
  if (fs.existsSync(annotationsPath)) {
    console.log('3. Importing annotations...');
    const annotationsData = JSON.parse(fs.readFileSync(annotationsPath, 'utf-8'));
    const annotations = annotationsData.annotations || [];

    let annotationCount = 0;

    for (const annotation of annotations) {
      // Check if annotation already exists
      const existing = await pool.query('SELECT id FROM annotations WHERE id = $1', [annotation.id]);
      if (existing.rows.length > 0) {
        console.log(`   Skipping existing annotation: ${annotation.id}`);
        continue;
      }

      // Check if referenced run exists
      const runExists = await pool.query('SELECT id FROM runs WHERE id = $1', [annotation.runId]);
      if (runExists.rows.length === 0) {
        console.log(`   Skipping annotation (run not found): ${annotation.id}`);
        continue;
      }

      await pool.query(`
        INSERT INTO annotations (id, run_id, prompt_number, issue_type, severity, note, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (run_id, prompt_number) DO NOTHING
      `, [
        annotation.id,
        annotation.runId,
        annotation.promptNumber,
        annotation.issueType,
        annotation.severity,
        annotation.note || '',
        annotation.createdAt,
        annotation.updatedAt
      ]);
      annotationCount++;
    }

    console.log(`   ✓ Imported ${annotationCount} annotations\n`);
  } else {
    console.log('3. No annotations.json found, skipping annotations import\n');
  }

  // Verify
  console.log('4. Verification...');
  const runStats = await pool.query('SELECT COUNT(*) as count FROM runs');
  const promptStats = await pool.query('SELECT COUNT(*) as count FROM prompts');
  const annotationStats = await pool.query('SELECT COUNT(*) as count FROM annotations');

  console.log(`   Runs in database: ${runStats.rows[0].count}`);
  console.log(`   Prompts in database: ${promptStats.rows[0].count}`);
  console.log(`   Annotations in database: ${annotationStats.rows[0].count}`);

  console.log('\n✅ Migration complete!');

  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
