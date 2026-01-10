import fs from 'fs';
import path from 'path';
import { query, queryOne, transaction, isDatabaseConfigured } from './db';
import type { PoolClient } from 'pg';

// ============================================
// Message-based conversation structure
// ============================================

export type MessageRole = 'user' | 'agent' | 'context';

export interface Message {
  id: number;                    // Sequential ID within the run
  role: MessageRole;
  text: string;
  artifact?: string;             // Path to artifact (only agent messages)
  contextPreview?: string;       // Thumbnail for context messages
}

// ============================================
// Legacy prompt-based structure (for backward compatibility)
// ============================================

// Prompt during capture phase (before scoring)
export interface CapturePrompt {
  number: number;
  title: string;
  text: string;
  artifact: string;
  observation: string;  // Raw observation before scoring
  capturedAt: string;
  response?: string;    // Sidekick's text response (optional)
}

// Detailed visual evaluation for each prompt
export interface VisualEvaluation {
  promptAdherence: {
    score: number;
    issues: string[];
  };
  visualQuality: {
    score: number;
    glitches: string[];
  };
  copyQuality: {
    score: number;
    issues: string[];
  };
  styleConsistency: {
    score: number;
    issues: string[];
  };
  improvements: string[];
}

// Prompt after scoring phase
export interface ScoredPrompt {
  number: number;
  title: string;
  text: string;
  status: 'pass' | 'warning' | 'fail';
  note: string;
  artifact: string;
  evaluation?: VisualEvaluation;  // Detailed visual evaluation
  response?: string;              // Sidekick's text response (optional)
}

// Legacy alias for backward compatibility
export type Prompt = ScoredPrompt;

// Run in capture phase (not yet scored)
export interface CaptureRun {
  id: string;
  name?: string;  // Human-readable title describing the test goal
  testType: string;  // e.g., 'ai-generated-iteration'
  format: string;
  timestamp: string;
  state: 'capturing' | 'captured';
  prompts: CapturePrompt[];       // Legacy prompt structure
  messages?: Message[];           // New message-based structure
}

// Iteration analysis across versions
export interface IterationAnalysis {
  v1ToV2: string;  // How V2 addressed V1 feedback
  v2ToV3: string;  // How V3 addressed V2 feedback
  regressions?: string[];  // Things that got worse
}

// 3-tier rating system: bad, good, great
export type Rating = 'bad' | 'good' | 'great';

// Run after scoring (complete)
export interface ScoredRun {
  id: string;
  name?: string;  // Human-readable title describing the test goal
  testType: string;  // e.g., 'ai-generated-iteration'
  format: string;
  timestamp: string;
  state: 'scored';
  rating: Rating;  // Overall: bad, good, or great
  scores?: {  // Legacy numeric scores (optional for backward compatibility)
    overall: number;
    promptAdherence: number;
    iterationQuality: number;
  };
  good: string[];
  bad: string[];
  summary?: string;
  issues?: { severity: string; text: string }[];
  iterationAnalysis?: IterationAnalysis;
  prompts: ScoredPrompt[];        // Legacy prompt structure
  messages?: Message[];           // New message-based structure
}

// Legacy Run type (scored runs without explicit state, defaults to ai-generated-iteration)
export interface LegacyRun {
  id: string;
  name?: string;  // Human-readable title describing the test goal
  testType?: string;  // Optional for backward compatibility, defaults to 'ai-generated-iteration'
  format: string;
  timestamp: string;
  scores: {
    overall: number;
    promptAdherence: number;
    iterationQuality: number;
  };
  good: string[];
  bad: string[];
  summary?: string;
  issues?: { severity: string; text: string }[];
  prompts: ScoredPrompt[];        // Legacy prompt structure
  messages?: Message[];           // New message-based structure
}

// Union type for any run
export type Run = CaptureRun | ScoredRun | LegacyRun;

// Type guard to check if a run is scored
export function isScored(run: Run): run is ScoredRun | LegacyRun {
  return !('state' in run) || run.state === 'scored';
}

// Type guard to check if a run is in capture phase
export function isCapturing(run: Run): run is CaptureRun {
  return 'state' in run && (run.state === 'capturing' || run.state === 'captured');
}

// Get messages from a run (returns messages array, or converts legacy prompts)
export function getRunMessages(run: Run): Message[] {
  // If run has messages array, use it
  if (run.messages && run.messages.length > 0) {
    return run.messages;
  }

  // Convert legacy prompts to messages
  const messages: Message[] = [];
  let messageId = 1;

  run.prompts.forEach(prompt => {
    // User message (the prompt text)
    messages.push({
      id: messageId++,
      role: 'user',
      text: prompt.text
    });

    // Agent response (if available)
    const response = 'response' in prompt ? prompt.response : undefined;
    if (response || prompt.artifact) {
      messages.push({
        id: messageId++,
        role: 'agent',
        text: response || '',
        artifact: prompt.artifact || undefined
      });
    }
  });

  return messages;
}

// Get the rating for a run (converts legacy numeric scores if needed)
export function getRunRating(run: Run): Rating | null {
  if (!isScored(run)) return null;

  // New rating system
  if ('rating' in run && run.rating) {
    return run.rating;
  }

  // Convert legacy numeric scores
  if (run.scores) {
    const score = run.scores.overall;
    if (score >= 8) return 'great';
    if (score >= 5) return 'good';
    return 'bad';
  }

  return null;
}

export interface RunsData {
  runs: Run[];
}

const DATA_PATH = path.join(process.cwd(), 'data', 'runs.json');

// ============================================
// File-based storage (fallback)
// ============================================

function getRunsFromFile(): Run[] {
  const data = fs.readFileSync(DATA_PATH, 'utf-8');
  const parsed: RunsData = JSON.parse(data);
  return parsed.runs;
}

function saveRunsToFile(runs: Run[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify({ runs }, null, 2));
}

// ============================================
// Database storage
// ============================================

interface DbRun {
  id: string;
  name: string | null;
  test_type: string;
  format: string;
  timestamp: Date;
  state: string;
  rating: string | null;
  scores: { overall: number; promptAdherence: number; iterationQuality: number } | null;
  good: string[];
  bad: string[];
  summary: string | null;
  issues: { severity: string; text: string }[] | null;
  iteration_analysis: IterationAnalysis | null;
}

interface DbPrompt {
  id: number;
  run_id: string;
  number: number;
  title: string;
  text: string;
  artifact: string | null;
  observation: string | null;
  captured_at: Date | null;
  status: string | null;
  note: string | null;
  evaluation: VisualEvaluation | null;
  response: string | null;
}

function dbToRun(row: DbRun, prompts: DbPrompt[]): Run {
  const sortedPrompts = prompts
    .filter(p => p.run_id === row.id)
    .sort((a, b) => a.number - b.number);

  if (row.state === 'capturing' || row.state === 'captured') {
    const captureRun: CaptureRun = {
      id: row.id,
      testType: row.test_type,
      format: row.format,
      timestamp: row.timestamp.toISOString(),
      state: row.state as 'capturing' | 'captured',
      prompts: sortedPrompts.map(p => ({
        number: p.number,
        title: p.title,
        text: p.text,
        artifact: p.artifact || '',
        observation: p.observation || '',
        capturedAt: p.captured_at?.toISOString() || '',
        ...(p.response ? { response: p.response } : {})
      }))
    };
    if (row.name) captureRun.name = row.name;
    return captureRun;
  }

  // Scored run
  const scoredRun: ScoredRun = {
    id: row.id,
    testType: row.test_type,
    format: row.format,
    timestamp: row.timestamp.toISOString(),
    state: 'scored',
    rating: (row.rating as Rating) || 'bad',
    good: row.good || [],
    bad: row.bad || [],
    prompts: sortedPrompts.map(p => ({
      number: p.number,
      title: p.title,
      text: p.text,
      artifact: p.artifact || '',
      status: (p.status as 'pass' | 'warning' | 'fail') || 'warning',
      note: p.note || '',
      evaluation: p.evaluation || undefined,
      ...(p.response ? { response: p.response } : {})
    }))
  };

  if (row.name) scoredRun.name = row.name;
  if (row.scores) scoredRun.scores = row.scores;
  if (row.summary) scoredRun.summary = row.summary;
  if (row.issues) scoredRun.issues = row.issues;
  if (row.iteration_analysis) scoredRun.iterationAnalysis = row.iteration_analysis;

  return scoredRun;
}

async function getRunsFromDb(): Promise<Run[]> {
  const runs = await query<DbRun>('SELECT * FROM runs ORDER BY timestamp DESC');
  const prompts = await query<DbPrompt>('SELECT * FROM prompts');
  return runs.map(r => dbToRun(r, prompts));
}

async function getRunByIdFromDb(id: string): Promise<Run | undefined> {
  const run = await queryOne<DbRun>('SELECT * FROM runs WHERE id = $1', [id]);
  if (!run) return undefined;

  const prompts = await query<DbPrompt>('SELECT * FROM prompts WHERE run_id = $1', [id]);
  return dbToRun(run, prompts);
}

async function saveRunToDb(run: Run): Promise<void> {
  await transaction(async (client: PoolClient) => {
    const state = 'state' in run ? run.state : 'scored';
    const rating = isScored(run) ? (('rating' in run ? run.rating : null) || getRunRating(run)) : null;
    const scores = isScored(run) ? run.scores || null : null;
    const good = isScored(run) ? run.good : [];
    const bad = isScored(run) ? run.bad : [];
    const summary = isScored(run) ? run.summary || null : null;
    const issues = isScored(run) ? run.issues || null : null;
    const iterationAnalysis = isScored(run) && 'iterationAnalysis' in run ? run.iterationAnalysis || null : null;
    const name = 'name' in run ? run.name || null : null;

    // Upsert run
    await client.query(`
      INSERT INTO runs (id, name, test_type, format, timestamp, state, rating, scores, good, bad, summary, issues, iteration_analysis, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        test_type = EXCLUDED.test_type,
        format = EXCLUDED.format,
        timestamp = EXCLUDED.timestamp,
        state = EXCLUDED.state,
        rating = EXCLUDED.rating,
        scores = EXCLUDED.scores,
        good = EXCLUDED.good,
        bad = EXCLUDED.bad,
        summary = EXCLUDED.summary,
        issues = EXCLUDED.issues,
        iteration_analysis = EXCLUDED.iteration_analysis,
        updated_at = NOW()
    `, [
      run.id,
      name,
      run.testType || 'ai-generated-iteration',
      run.format,
      run.timestamp,
      state,
      rating,
      scores ? JSON.stringify(scores) : null,
      good,
      bad,
      summary,
      issues ? JSON.stringify(issues) : null,
      iterationAnalysis ? JSON.stringify(iterationAnalysis) : null
    ]);

    // Delete existing prompts and re-insert
    await client.query('DELETE FROM prompts WHERE run_id = $1', [run.id]);

    for (const prompt of run.prompts) {
      const isCapture = 'observation' in prompt;

      await client.query(`
        INSERT INTO prompts (run_id, number, title, text, artifact, observation, captured_at, status, note, evaluation, response)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        run.id,
        prompt.number,
        prompt.title,
        prompt.text,
        prompt.artifact || null,
        isCapture ? (prompt as CapturePrompt).observation : null,
        isCapture ? (prompt as CapturePrompt).capturedAt : null,
        !isCapture ? (prompt as ScoredPrompt).status : null,
        !isCapture ? (prompt as ScoredPrompt).note : null,
        !isCapture && (prompt as ScoredPrompt).evaluation ? JSON.stringify((prompt as ScoredPrompt).evaluation) : null,
        prompt.response || null
      ]);
    }
  });
}

async function deleteRunFromDb(id: string): Promise<boolean> {
  const result = await query('DELETE FROM runs WHERE id = $1 RETURNING id', [id]);
  return result.length > 0;
}

// ============================================
// Public API (supports both file and database)
// ============================================

export function getRuns(): Run[] {
  return getRunsFromFile();
}

export async function getRunsAsync(): Promise<Run[]> {
  if (isDatabaseConfigured()) {
    return getRunsFromDb();
  }
  return getRunsFromFile();
}

export function getRunById(id: string): Run | undefined {
  const runs = getRuns();
  return runs.find(r => r.id === id);
}

export async function getRunByIdAsync(id: string): Promise<Run | undefined> {
  if (isDatabaseConfigured()) {
    return getRunByIdFromDb(id);
  }
  return getRunById(id);
}

export function getRunsByFormat(format: string): Run[] {
  const runs = getRuns();
  return runs.filter(r => r.format === format).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function getRunsByFormatAsync(format: string): Promise<Run[]> {
  if (isDatabaseConfigured()) {
    const runs = await getRunsFromDb();
    return runs.filter(r => r.format === format);
  }
  return getRunsByFormat(format);
}

export function getFormats(): { [key: string]: { runs: Run[]; latest: Run } } {
  const runs = getRuns();
  const formats: { [key: string]: { runs: Run[]; latest: Run } } = {};

  runs.forEach(run => {
    if (!formats[run.format]) {
      formats[run.format] = { runs: [], latest: run };
    }
    formats[run.format].runs.push(run);
    if (new Date(run.timestamp) > new Date(formats[run.format].latest.timestamp)) {
      formats[run.format].latest = run;
    }
  });

  return formats;
}

export async function getFormatsAsync(): Promise<{ [key: string]: { runs: Run[]; latest: Run } }> {
  if (isDatabaseConfigured()) {
    const runs = await getRunsFromDb();
    const formats: { [key: string]: { runs: Run[]; latest: Run } } = {};

    runs.forEach(run => {
      if (!formats[run.format]) {
        formats[run.format] = { runs: [], latest: run };
      }
      formats[run.format].runs.push(run);
      if (new Date(run.timestamp) > new Date(formats[run.format].latest.timestamp)) {
        formats[run.format].latest = run;
      }
    });

    return formats;
  }
  return getFormats();
}

// Get the test type for a run (defaults to 'ai-generated-iteration' for legacy runs)
export function getRunTestType(run: Run): string {
  return run.testType || 'ai-generated-iteration';
}

// Get runs grouped by test type
export function getRunsByTestType(): { [testType: string]: Run[] } {
  const runs = getRuns();
  const grouped: { [testType: string]: Run[] } = {};

  runs.forEach(run => {
    const testType = getRunTestType(run);
    if (!grouped[testType]) {
      grouped[testType] = [];
    }
    grouped[testType].push(run);
  });

  return grouped;
}

export async function getRunsByTestTypeAsync(): Promise<{ [testType: string]: Run[] }> {
  if (isDatabaseConfigured()) {
    const runs = await getRunsFromDb();
    const grouped: { [testType: string]: Run[] } = {};

    runs.forEach(run => {
      const testType = getRunTestType(run);
      if (!grouped[testType]) {
        grouped[testType] = [];
      }
      grouped[testType].push(run);
    });

    return grouped;
  }
  return getRunsByTestType();
}

// Get formats for a specific test type
export function getFormatsByTestType(testType: string): { [format: string]: { runs: Run[]; latest: Run } } {
  const runs = getRuns().filter(r => getRunTestType(r) === testType);
  const formats: { [format: string]: { runs: Run[]; latest: Run } } = {};

  runs.forEach(run => {
    if (!formats[run.format]) {
      formats[run.format] = { runs: [], latest: run };
    }
    formats[run.format].runs.push(run);
    if (new Date(run.timestamp) > new Date(formats[run.format].latest.timestamp)) {
      formats[run.format].latest = run;
    }
  });

  return formats;
}

export async function getFormatsByTestTypeAsync(testType: string): Promise<{ [format: string]: { runs: Run[]; latest: Run } }> {
  if (isDatabaseConfigured()) {
    const allRuns = await getRunsFromDb();
    const runs = allRuns.filter(r => getRunTestType(r) === testType);
    const formats: { [format: string]: { runs: Run[]; latest: Run } } = {};

    runs.forEach(run => {
      if (!formats[run.format]) {
        formats[run.format] = { runs: [], latest: run };
      }
      formats[run.format].runs.push(run);
      if (new Date(run.timestamp) > new Date(formats[run.format].latest.timestamp)) {
        formats[run.format].latest = run;
      }
    });

    return formats;
  }
  return getFormatsByTestType(testType);
}

// Get runs for a specific test type and format
export function getRunsByTestTypeAndFormat(testType: string, format: string): Run[] {
  return getRuns()
    .filter(r => getRunTestType(r) === testType && r.format === format)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getRunsByTestTypeAndFormatAsync(testType: string, format: string): Promise<Run[]> {
  if (isDatabaseConfigured()) {
    const runs = await getRunsFromDb();
    return runs.filter(r => getRunTestType(r) === testType && r.format === format);
  }
  return getRunsByTestTypeAndFormat(testType, format);
}

export function saveRun(run: Run): void {
  const runs = getRuns();
  const existingIndex = runs.findIndex(r => r.id === run.id);

  if (existingIndex >= 0) {
    runs[existingIndex] = run;
  } else {
    runs.push(run);
  }

  saveRunsToFile(runs);
}

export async function saveRunAsync(run: Run): Promise<void> {
  if (isDatabaseConfigured()) {
    return saveRunToDb(run);
  }
  return saveRun(run);
}

export function deleteRun(id: string): boolean {
  const runs = getRuns();
  const filtered = runs.filter(r => r.id !== id);

  if (filtered.length === runs.length) return false;

  saveRunsToFile(filtered);
  return true;
}

export async function deleteRunAsync(id: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    return deleteRunFromDb(id);
  }
  return deleteRun(id);
}

// ============================================
// Capture Phase Functions
// ============================================

export function startCapture(format: string, testType: string = 'ai-generated-iteration'): CaptureRun {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '-');
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
  const id = `${format}-${dateStr}-${timeStr}`;

  const captureRun: CaptureRun = {
    id,
    testType,
    format,
    timestamp: now.toISOString(),
    state: 'capturing',
    prompts: []
  };

  const runs = getRuns();
  runs.push(captureRun);
  saveRunsToFile(runs);

  return captureRun;
}

export async function startCaptureAsync(format: string, testType: string = 'ai-generated-iteration'): Promise<CaptureRun> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '-');
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
  const id = `${format}-${dateStr}-${timeStr}`;

  const captureRun: CaptureRun = {
    id,
    testType,
    format,
    timestamp: now.toISOString(),
    state: 'capturing',
    prompts: []
  };

  if (isDatabaseConfigured()) {
    await saveRunToDb(captureRun);
  } else {
    const runs = getRuns();
    runs.push(captureRun);
    saveRunsToFile(runs);
  }

  return captureRun;
}

export function saveCapturePrompt(
  runId: string,
  prompt: Omit<CapturePrompt, 'capturedAt'>
): CaptureRun | null {
  const runs = getRuns();
  const runIndex = runs.findIndex(r => r.id === runId);

  if (runIndex < 0) return null;

  const run = runs[runIndex];
  if (!isCapturing(run)) return null;

  const capturePrompt: CapturePrompt = {
    ...prompt,
    capturedAt: new Date().toISOString()
  };

  // Replace existing prompt with same number or add new
  const existingIdx = run.prompts.findIndex(p => p.number === prompt.number);
  if (existingIdx >= 0) {
    run.prompts[existingIdx] = capturePrompt;
  } else {
    run.prompts.push(capturePrompt);
  }

  runs[runIndex] = run;
  saveRunsToFile(runs);

  return run;
}

export async function saveCapturePromptAsync(
  runId: string,
  prompt: Omit<CapturePrompt, 'capturedAt'>
): Promise<CaptureRun | null> {
  if (isDatabaseConfigured()) {
    const run = await getRunByIdFromDb(runId);
    if (!run || !isCapturing(run)) return null;

    const capturePrompt: CapturePrompt = {
      ...prompt,
      capturedAt: new Date().toISOString()
    };

    const existingIdx = run.prompts.findIndex(p => p.number === prompt.number);
    if (existingIdx >= 0) {
      run.prompts[existingIdx] = capturePrompt;
    } else {
      run.prompts.push(capturePrompt);
    }

    await saveRunToDb(run);
    return run;
  }
  return saveCapturePrompt(runId, prompt);
}

export function completeCapture(runId: string): CaptureRun | null {
  const runs = getRuns();
  const runIndex = runs.findIndex(r => r.id === runId);

  if (runIndex < 0) return null;

  const run = runs[runIndex];
  if (!isCapturing(run)) return null;

  run.state = 'captured';
  runs[runIndex] = run;
  saveRunsToFile(runs);

  return run;
}

export async function completeCaptureAsync(runId: string): Promise<CaptureRun | null> {
  if (isDatabaseConfigured()) {
    const run = await getRunByIdFromDb(runId);
    if (!run || !isCapturing(run)) return null;

    run.state = 'captured';
    await saveRunToDb(run);
    return run;
  }
  return completeCapture(runId);
}

export function getPendingRuns(): CaptureRun[] {
  const runs = getRuns();
  return runs.filter((r): r is CaptureRun =>
    'state' in r && r.state === 'captured'
  );
}

export async function getPendingRunsAsync(): Promise<CaptureRun[]> {
  if (isDatabaseConfigured()) {
    const runs = await getRunsFromDb();
    return runs.filter((r): r is CaptureRun =>
      'state' in r && r.state === 'captured'
    );
  }
  return getPendingRuns();
}

export function getCapturingRuns(): CaptureRun[] {
  const runs = getRuns();
  return runs.filter((r): r is CaptureRun =>
    'state' in r && r.state === 'capturing'
  );
}

export async function getCapturingRunsAsync(): Promise<CaptureRun[]> {
  if (isDatabaseConfigured()) {
    const runs = await getRunsFromDb();
    return runs.filter((r): r is CaptureRun =>
      'state' in r && r.state === 'capturing'
    );
  }
  return getCapturingRuns();
}

// ============================================
// Scoring Phase Functions
// ============================================

export interface ScoreInput {
  runId: string;
  scores: {
    overall: number;
    promptAdherence: number;
    iterationQuality: number;
  };
  good: string[];
  bad: string[];
  promptEvaluations: {
    number: number;
    status: 'pass' | 'warning' | 'fail';
    note: string;
  }[];
}

// ============================================
// Issue Themes for Hit List (Deduplicated)
// ============================================

export interface IssueExample {
  runId: string;
  format: string;
  testType: string;
  beforeImage: string;  // artifact path for "before" state
  afterImage: string;   // artifact path for "after" state
  beforeLabel: string;  // e.g., "V2 - With error handling"
  afterLabel: string;   // e.g., "V3 - Error handling lost"
  caption: string;      // Brief explanation
}

export interface IssueTheme {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  occurrences: {
    runId: string;
    format: string;
    promptNumber?: number;
  }[];
  affectedFormats: string[];
  count: number;
  example?: IssueExample;  // Best example to illustrate the issue
}

export function getAllIssues(): IssueTheme[] {
  const runs = getRuns();
  return computeIssueThemes(runs);
}

export async function getAllIssuesAsync(): Promise<IssueTheme[]> {
  if (isDatabaseConfigured()) {
    const runs = await getRunsFromDb();
    return computeIssueThemes(runs);
  }
  return getAllIssues();
}

function computeIssueThemes(runs: Run[]): IssueTheme[] {
  // Track root causes and their manifestations
  const rootCauses: Map<string, {
    theme: IssueTheme;
    manifestations: Set<string>;
    preferredExampleRunId?: string;
    preferredExamplePromptIdx?: [number, number];
  }> = new Map();

  // Helper to add occurrence to a root cause
  const addToRootCause = (
    causeId: string,
    severity: 'high' | 'medium' | 'low',
    title: string,
    description: string,
    runId: string,
    format: string,
    manifestation: string
  ) => {
    if (!rootCauses.has(causeId)) {
      rootCauses.set(causeId, {
        theme: {
          id: causeId,
          severity,
          title,
          description,
          occurrences: [],
          affectedFormats: [],
          count: 0
        },
        manifestations: new Set()
      });
    }
    const cause = rootCauses.get(causeId)!;

    const alreadyCounted = cause.theme.occurrences.some(o => o.runId === runId && o.format === format);

    if (!alreadyCounted) {
      cause.theme.occurrences.push({ runId, format });
      cause.theme.count++;
    }

    if (!cause.theme.affectedFormats.includes(format)) {
      cause.theme.affectedFormats.push(format);
    }

    cause.manifestations.add(manifestation);
  };

  runs.forEach(run => {
    if (!isScored(run)) return;

    run.bad.forEach(badItem => {
      const lower = badItem.toLowerCase();

      // ROOT CAUSE 1: No Context Passed Between Iterations
      if (lower.includes('template') || lower.includes('placeholder') ||
          lower.includes('instruction') || lower.includes('generic')) {
        addToRootCause('no-iteration-context', 'high',
          'No Context Passed Between Iterations',
          'Sidekick does not receive or retain context from previous prompts in the same session.',
          run.id, run.format, 'Creates template/instructions instead of editing actual content');
      }

      if (lower.includes('iteration') || lower.includes('continuity') ||
          lower.includes('fresh') || lower.includes('starting fresh')) {
        addToRootCause('no-iteration-context', 'high',
          'No Context Passed Between Iterations',
          'Sidekick does not receive or retain context from previous prompts in the same session.',
          run.id, run.format, 'Treats each prompt as starting fresh');
      }

      if (lower.includes('new artifact') || lower.includes('standalone') ||
          lower.includes('separate') || lower.includes('instead of integrating')) {
        addToRootCause('no-iteration-context', 'high',
          'No Context Passed Between Iterations',
          'Sidekick does not receive or retain context from previous prompts in the same session.',
          run.id, run.format, 'Creates new artifact instead of modifying existing one');
      }

      // ROOT CAUSE 2: Visual Style Not Preserved
      if ((lower.includes('style') || lower.includes('visual')) &&
          (lower.includes('changed') || lower.includes('different') || lower.includes('drift'))) {
        addToRootCause('style-not-preserved', 'high',
          'Visual Style Not Preserved Across Iterations',
          'When iterating on visual artifacts, the original style/theme is not maintained.',
          run.id, run.format, 'Style changed unexpectedly between versions');
      }

      if (lower.includes('color') && (lower.includes('palette') || lower.includes('scheme') ||
          lower.includes('changed') || lower.includes('different'))) {
        addToRootCause('style-not-preserved', 'high',
          'Visual Style Not Preserved Across Iterations',
          'When iterating on visual artifacts, the original style/theme is not maintained.',
          run.id, run.format, 'Color palette changed without request');
      }

      // ROOT CAUSE 3: Table Structure/Tags Lost
      if (run.format === 'table') {
        if (lower.includes('column') && (lower.includes('deleted') || lower.includes('lost') ||
            lower.includes('removed') || lower.includes('replaced'))) {
          addToRootCause('table-structure-loss', 'high',
            'Table Structure Destroyed on Edit',
            'When asked to add or modify a single column, Sidekick deletes other columns.',
            run.id, run.format, 'Columns deleted when adding new column');
        }

        if (lower.includes('tag') || lower.includes('badge') ||
            (lower.includes('color') && lower.includes('coded'))) {
          addToRootCause('table-structure-loss', 'high',
            'Table Structure Destroyed on Edit',
            'When asked to add or modify a single column, Sidekick deletes other columns.',
            run.id, run.format, 'Color-coded tags/badges lost during edit');
        }
      }

      // ROOT CAUSE 4: Copy Rendering Issues
      if (lower.includes('truncated') || lower.includes('garbled') || lower.includes('corrupted') ||
          lower.includes('broken label') || lower.includes('random character')) {
        addToRootCause('copy-rendering-issues', 'high',
          'Text Rendering Breaks on Complex Artifacts',
          'Text in generated artifacts often renders incorrectly - truncated names, garbled characters.',
          run.id, run.format, 'Truncated or garbled text visible');
      }
    });
  });

  // Curated example mappings
  const exampleMappings: Record<string, { runId: string; beforeIdx: number; afterIdx: number }> = {
    'no-iteration-context': { runId: 'greenfield-document-2026-01-07-1455', beforeIdx: 0, afterIdx: 1 },
    'style-not-preserved': { runId: 'slides-2026-01-06-1730', beforeIdx: 0, afterIdx: 1 },
    'table-structure-loss': { runId: 'table-2026-01-06-1320', beforeIdx: 0, afterIdx: 1 },
    'copy-rendering-issues': { runId: 'prototype-2026-01-06-1825', beforeIdx: 0, afterIdx: 1 }
  };

  // Build final themes
  const themes: IssueTheme[] = [];

  rootCauses.forEach(({ theme, manifestations }, causeId) => {
    if (theme.count > 0) {
      const manifestationList = Array.from(manifestations);
      if (manifestationList.length > 0) {
        theme.description += '\n\nManifests as:\n• ' + manifestationList.join('\n• ');
      }

      const mapping = exampleMappings[causeId];
      if (mapping) {
        const exampleRun = runs.find(r => r.id === mapping.runId);
        if (exampleRun && isScored(exampleRun)) {
          const beforePrompt = exampleRun.prompts[mapping.beforeIdx] as ScoredPrompt;
          const afterPrompt = exampleRun.prompts[mapping.afterIdx] as ScoredPrompt;

          if (beforePrompt?.artifact && afterPrompt?.artifact) {
            theme.example = {
              runId: exampleRun.id,
              format: exampleRun.format,
              testType: getRunTestType(exampleRun),
              beforeImage: '/' + beforePrompt.artifact,
              afterImage: '/' + afterPrompt.artifact,
              beforeLabel: `V${beforePrompt.number} – ${beforePrompt.title}`,
              afterLabel: `V${afterPrompt.number} – ${afterPrompt.title}`,
              caption: afterPrompt.note || `${beforePrompt.title} → ${afterPrompt.title}`
            };
          }
        }
      }

      themes.push(theme);
    }
  });

  // Sort by severity then count
  const severityOrder = { high: 0, medium: 1, low: 2 };
  return themes.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.count - a.count;
  });
}

export function scoreRun(input: ScoreInput): ScoredRun | null {
  const runs = getRuns();
  const runIndex = runs.findIndex(r => r.id === input.runId);

  if (runIndex < 0) return null;

  const run = runs[runIndex];

  if (isCapturing(run) && run.state !== 'captured') return null;

  let scoredPrompts: ScoredPrompt[];

  if (isCapturing(run)) {
    scoredPrompts = run.prompts.map(cp => {
      const evaluation = input.promptEvaluations.find(e => e.number === cp.number);
      return {
        number: cp.number,
        title: cp.title,
        text: cp.text,
        artifact: cp.artifact,
        status: evaluation?.status || 'warning',
        note: evaluation?.note || cp.observation,
        ...(cp.response ? { response: cp.response } : {})
      };
    });
  } else {
    scoredPrompts = (run as ScoredRun | LegacyRun).prompts.map(sp => {
      const evaluation = input.promptEvaluations.find(e => e.number === sp.number);
      return {
        ...sp,
        status: evaluation?.status || sp.status,
        note: evaluation?.note || sp.note
      };
    });
  }

  const rating: Rating = input.scores.overall >= 8 ? 'great' : input.scores.overall >= 5 ? 'good' : 'bad';

  const scoredRun: ScoredRun = {
    id: run.id,
    testType: getRunTestType(run),
    format: run.format,
    timestamp: run.timestamp,
    state: 'scored',
    rating,
    scores: input.scores,
    good: input.good,
    bad: input.bad,
    prompts: scoredPrompts
  };

  runs[runIndex] = scoredRun;
  saveRunsToFile(runs);

  return scoredRun;
}

export async function scoreRunAsync(input: ScoreInput): Promise<ScoredRun | null> {
  if (isDatabaseConfigured()) {
    const run = await getRunByIdFromDb(input.runId);
    if (!run) return null;

    if (isCapturing(run) && run.state !== 'captured') return null;

    let scoredPrompts: ScoredPrompt[];

    if (isCapturing(run)) {
      scoredPrompts = run.prompts.map(cp => {
        const capPrompt = cp as CapturePrompt;
        const evaluation = input.promptEvaluations.find(e => e.number === capPrompt.number);
        return {
          number: capPrompt.number,
          title: cp.title,
          text: cp.text,
          artifact: cp.artifact,
          status: evaluation?.status || 'warning',
          note: evaluation?.note || capPrompt.observation,
          ...(capPrompt.response ? { response: capPrompt.response } : {})
        };
      });
    } else {
      scoredPrompts = (run as ScoredRun | LegacyRun).prompts.map(sp => {
        const evaluation = input.promptEvaluations.find(e => e.number === sp.number);
        return {
          ...sp,
          status: evaluation?.status || sp.status,
          note: evaluation?.note || sp.note
        };
      });
    }

    const rating: Rating = input.scores.overall >= 8 ? 'great' : input.scores.overall >= 5 ? 'good' : 'bad';

    const scoredRun: ScoredRun = {
      id: run.id,
      testType: getRunTestType(run),
      format: run.format,
      timestamp: run.timestamp,
      state: 'scored',
      rating,
      scores: input.scores,
      good: input.good,
      bad: input.bad,
      prompts: scoredPrompts
    };

    await saveRunToDb(scoredRun);
    return scoredRun;
  }
  return scoreRun(input);
}
