import fs from 'fs';
import path from 'path';

// Prompt during capture phase (before scoring)
export interface CapturePrompt {
  number: number;
  title: string;
  text: string;
  artifact: string;
  observation: string;  // Raw observation before scoring
  capturedAt: string;
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
}

// Legacy alias for backward compatibility
export type Prompt = ScoredPrompt;

// Run in capture phase (not yet scored)
export interface CaptureRun {
  id: string;
  testType: string;  // e.g., 'ai-generated-iteration'
  format: string;
  timestamp: string;
  state: 'capturing' | 'captured';
  prompts: CapturePrompt[];
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
  prompts: ScoredPrompt[];
}

// Legacy Run type (scored runs without explicit state, defaults to ai-generated-iteration)
export interface LegacyRun {
  id: string;
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
  prompts: ScoredPrompt[];
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

export function getRuns(): Run[] {
  const data = fs.readFileSync(DATA_PATH, 'utf-8');
  const parsed: RunsData = JSON.parse(data);
  return parsed.runs;
}

export function getRunById(id: string): Run | undefined {
  const runs = getRuns();
  return runs.find(r => r.id === id);
}

export function getRunsByFormat(format: string): Run[] {
  const runs = getRuns();
  return runs.filter(r => r.format === format).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
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

// Get runs for a specific test type and format
export function getRunsByTestTypeAndFormat(testType: string, format: string): Run[] {
  return getRuns()
    .filter(r => getRunTestType(r) === testType && r.format === format)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function saveRun(run: Run): void {
  const runs = getRuns();
  const existingIndex = runs.findIndex(r => r.id === run.id);

  if (existingIndex >= 0) {
    runs[existingIndex] = run;
  } else {
    runs.push(run);
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify({ runs }, null, 2));
}

export function deleteRun(id: string): boolean {
  const runs = getRuns();
  const filtered = runs.filter(r => r.id !== id);

  if (filtered.length === runs.length) return false;

  fs.writeFileSync(DATA_PATH, JSON.stringify({ runs: filtered }, null, 2));
  return true;
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
  fs.writeFileSync(DATA_PATH, JSON.stringify({ runs }, null, 2));

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
  fs.writeFileSync(DATA_PATH, JSON.stringify({ runs }, null, 2));

  return run;
}

export function completeCapture(runId: string): CaptureRun | null {
  const runs = getRuns();
  const runIndex = runs.findIndex(r => r.id === runId);

  if (runIndex < 0) return null;

  const run = runs[runIndex];
  if (!isCapturing(run)) return null;

  run.state = 'captured';
  runs[runIndex] = run;
  fs.writeFileSync(DATA_PATH, JSON.stringify({ runs }, null, 2));

  return run;
}

export function getPendingRuns(): CaptureRun[] {
  const runs = getRuns();
  return runs.filter((r): r is CaptureRun =>
    'state' in r && r.state === 'captured'
  );
}

export function getCapturingRuns(): CaptureRun[] {
  const runs = getRuns();
  return runs.filter((r): r is CaptureRun =>
    'state' in r && r.state === 'capturing'
  );
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
}

export function getAllIssues(): IssueTheme[] {
  const runs = getRuns();

  // Track root causes and their manifestations
  const rootCauses: Map<string, {
    theme: IssueTheme;
    manifestations: Set<string>;
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

    // Only count unique run+format combinations
    const key = `${runId}-${format}`;
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

    // Analyze bad items for patterns
    run.bad.forEach(badItem => {
      const lower = badItem.toLowerCase();

      // ============================================
      // ROOT CAUSE 1: No Context Passed Between Iterations
      // This is THE core issue - Sidekick doesn't see/remember previous output
      // ============================================

      // Manifestation: Lost iteration continuity
      if (lower.includes('iteration') || lower.includes('continuity') ||
          lower.includes('fresh') || lower.includes('starting fresh') ||
          lower.includes('each prompt') || lower.includes('state')) {
        addToRootCause(
          'no-iteration-context',
          'high',
          'No Context Passed Between Iterations',
          'Sidekick does not receive or retain context from previous prompts in the same session. Each prompt is treated as independent, causing cascading failures in multi-step workflows.',
          run.id, run.format,
          'Treats each prompt as starting fresh'
        );
      }

      // Manifestation: Destructive edits (doesn't know what exists)
      if (lower.includes('deleted') || lower.includes('lost') || lower.includes('removed') ||
          lower.includes('destructive')) {
        addToRootCause(
          'no-iteration-context',
          'high',
          'No Context Passed Between Iterations',
          'Sidekick does not receive or retain context from previous prompts in the same session. Each prompt is treated as independent, causing cascading failures in multi-step workflows.',
          run.id, run.format,
          'Deletes existing content when editing (doesn\'t see what\'s there)'
        );
      }

      // Manifestation: Creates template instead of editing (doesn't see the content)
      if (lower.includes('template') || lower.includes('placeholder') ||
          lower.includes('instruction') || lower.includes('generic')) {
        addToRootCause(
          'no-iteration-context',
          'high',
          'No Context Passed Between Iterations',
          'Sidekick does not receive or retain context from previous prompts in the same session. Each prompt is treated as independent, causing cascading failures in multi-step workflows.',
          run.id, run.format,
          'Creates template/instructions instead of editing actual content'
        );
      }

      // Manifestation: Content regenerated (doesn't preserve original values)
      if (lower.includes('regenerated') || lower.includes('different values') ||
          lower.includes('different content')) {
        addToRootCause(
          'no-iteration-context',
          'high',
          'No Context Passed Between Iterations',
          'Sidekick does not receive or retain context from previous prompts in the same session. Each prompt is treated as independent, causing cascading failures in multi-step workflows.',
          run.id, run.format,
          'Regenerates content with different values instead of preserving'
        );
      }

      // Manifestation: Creates new artifact instead of editing existing
      if (lower.includes('new artifact') || lower.includes('standalone') ||
          lower.includes('separate') || lower.includes('instead of integrating')) {
        addToRootCause(
          'no-iteration-context',
          'high',
          'No Context Passed Between Iterations',
          'Sidekick does not receive or retain context from previous prompts in the same session. Each prompt is treated as independent, causing cascading failures in multi-step workflows.',
          run.id, run.format,
          'Creates new artifact instead of modifying existing one'
        );
      }

      // ============================================
      // ROOT CAUSE 2: Visual Style Not Preserved
      // Style/theme information not carried forward
      // ============================================

      if (lower.includes('style') && (lower.includes('changed') || lower.includes('different'))) {
        addToRootCause(
          'style-not-preserved',
          'medium',
          'Visual Style Not Preserved Across Iterations',
          'When iterating on visual artifacts, the original style/theme is not maintained. Colors, design language, and visual consistency drift between versions.',
          run.id, run.format,
          'Style changed unexpectedly between versions'
        );
      }

      if (lower.includes('color') && (lower.includes('lost') || lower.includes('uniform') ||
          lower.includes('same') || lower.includes('changed'))) {
        addToRootCause(
          'style-not-preserved',
          'medium',
          'Visual Style Not Preserved Across Iterations',
          'When iterating on visual artifacts, the original style/theme is not maintained. Colors, design language, and visual consistency drift between versions.',
          run.id, run.format,
          'Color coding/theming lost during iteration'
        );
      }

      if (lower.includes('visual') && lower.includes('lost')) {
        addToRootCause(
          'style-not-preserved',
          'medium',
          'Visual Style Not Preserved Across Iterations',
          'When iterating on visual artifacts, the original style/theme is not maintained. Colors, design language, and visual consistency drift between versions.',
          run.id, run.format,
          'Visual organization/groupings lost'
        );
      }
    });
  });

  // Build final themes with manifestation details in description
  const themes: IssueTheme[] = [];

  rootCauses.forEach(({ theme, manifestations }) => {
    if (theme.count > 0) {
      // Add manifestations to description
      const manifestationList = Array.from(manifestations);
      if (manifestationList.length > 0) {
        theme.description += '\n\nManifests as:\n• ' + manifestationList.join('\n• ');
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

  // Can only score captured runs or re-score existing runs
  if (isCapturing(run) && run.state !== 'captured') return null;

  // Build scored prompts from capture prompts + evaluations
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
        note: evaluation?.note || cp.observation
      };
    });
  } else {
    // Re-scoring an existing scored run
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
  fs.writeFileSync(DATA_PATH, JSON.stringify({ runs }, null, 2));

  return scoredRun;
}
