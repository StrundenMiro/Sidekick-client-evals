import fs from 'fs';
import path from 'path';
import { query, queryOne, isDatabaseConfigured } from './db';

// Issue types that can be quickly selected
export const ISSUE_TYPES = [
  { id: 'context-lost', label: 'Context Lost', description: 'Lost previous iteration context' },
  { id: 'style-drift', label: 'Style Drift', description: 'Visual style changed unexpectedly' },
  { id: 'text-broken', label: 'Text Broken', description: 'Truncated, garbled, or broken text' },
  { id: 'data-deleted', label: 'Data Deleted', description: 'Content was deleted unexpectedly' },
  { id: 'wrong-output', label: 'Wrong Output', description: 'Output doesn\'t match request' },
  { id: 'other', label: 'Other', description: 'Other issue' }
] as const;

export type IssueType = typeof ISSUE_TYPES[number]['id'];
export type Severity = 'high' | 'medium' | 'low' | 'good';
export type Author = 'frank' | 'human';

export interface Annotation {
  id: string;
  runId: string;
  promptNumber: number;
  author: Author;
  issueType: IssueType;
  severity: Severity;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationsData {
  annotations: Annotation[];
}

const DATA_PATH = path.join(process.cwd(), 'data', 'annotations.json');

// ============================================
// File-based storage (fallback)
// ============================================

function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_PATH, JSON.stringify({ annotations: [] }, null, 2));
  }
}

function getAnnotationsFromFile(): Annotation[] {
  ensureDataFile();
  const data = fs.readFileSync(DATA_PATH, 'utf-8');
  const parsed: AnnotationsData = JSON.parse(data);
  return parsed.annotations;
}

function saveAnnotationsToFile(annotations: Annotation[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify({ annotations }, null, 2));
}

// ============================================
// Database storage
// ============================================

interface DbAnnotation {
  id: string;
  run_id: string;
  prompt_number: number;
  author: string;
  issue_type: string;
  severity: string;
  note: string;
  created_at: Date;
  updated_at: Date;
}

function dbToAnnotation(row: DbAnnotation): Annotation {
  return {
    id: row.id,
    runId: row.run_id,
    promptNumber: row.prompt_number,
    author: (row.author || 'human') as Author,
    issueType: row.issue_type as IssueType,
    severity: row.severity as Severity,
    note: row.note || '',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

async function getAnnotationsFromDb(): Promise<Annotation[]> {
  const rows = await query<DbAnnotation>(
    'SELECT * FROM annotations ORDER BY created_at DESC'
  );
  return rows.map(dbToAnnotation);
}

async function getAnnotationsForRunFromDb(runId: string): Promise<Annotation[]> {
  const rows = await query<DbAnnotation>(
    'SELECT * FROM annotations WHERE run_id = $1 ORDER BY prompt_number',
    [runId]
  );
  return rows.map(dbToAnnotation);
}

async function getAnnotationForPromptFromDb(runId: string, promptNumber: number): Promise<Annotation | null> {
  const row = await queryOne<DbAnnotation>(
    'SELECT * FROM annotations WHERE run_id = $1 AND prompt_number = $2',
    [runId, promptNumber]
  );
  return row ? dbToAnnotation(row) : null;
}

async function saveAnnotationToDb(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Annotation> {
  const now = new Date();

  // If we have an ID, update existing annotation
  if (annotation.id) {
    const row = await queryOne<DbAnnotation>(`
      UPDATE annotations SET
        issue_type = $1,
        severity = $2,
        note = $3,
        updated_at = $4
      WHERE id = $5
      RETURNING *
    `, [annotation.issueType, annotation.severity, annotation.note, now, annotation.id]);
    return dbToAnnotation(row!);
  }

  // Otherwise create new annotation
  const id = `${annotation.runId}-v${annotation.promptNumber}-${Date.now()}`;
  const row = await queryOne<DbAnnotation>(`
    INSERT INTO annotations (id, run_id, prompt_number, author, issue_type, severity, note, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
    RETURNING *
  `, [id, annotation.runId, annotation.promptNumber, annotation.author || 'human', annotation.issueType, annotation.severity, annotation.note, now]);

  return dbToAnnotation(row!);
}

async function deleteAnnotationFromDb(runId: string, promptNumber: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM annotations WHERE run_id = $1 AND prompt_number = $2 RETURNING id',
    [runId, promptNumber]
  );
  return result.length > 0;
}

async function deleteAnnotationByIdFromDb(annotationId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM annotations WHERE id = $1 RETURNING id',
    [annotationId]
  );
  return result.length > 0;
}

async function getAnnotationsForPromptFromDb(runId: string, promptNumber: number): Promise<Annotation[]> {
  const rows = await query<DbAnnotation>(
    'SELECT * FROM annotations WHERE run_id = $1 AND prompt_number = $2 ORDER BY created_at',
    [runId, promptNumber]
  );
  return rows.map(dbToAnnotation);
}

// ============================================
// Public API (auto-selects storage backend)
// ============================================

export function getAnnotations(): Annotation[] {
  // Sync version always uses file
  return getAnnotationsFromFile();
}

export async function getAnnotationsAsync(): Promise<Annotation[]> {
  if (isDatabaseConfigured()) {
    return getAnnotationsFromDb();
  }
  return getAnnotationsFromFile();
}

export function getAnnotationsForRun(runId: string): Annotation[] {
  return getAnnotations().filter(a => a.runId === runId);
}

export async function getAnnotationsForRunAsync(runId: string): Promise<Annotation[]> {
  if (isDatabaseConfigured()) {
    return getAnnotationsForRunFromDb(runId);
  }
  return getAnnotationsForRun(runId);
}

export function getAnnotationForPrompt(runId: string, promptNumber: number): Annotation | null {
  const annotations = getAnnotations();
  return annotations.find(a => a.runId === runId && a.promptNumber === promptNumber) || null;
}

export async function getAnnotationForPromptAsync(runId: string, promptNumber: number): Promise<Annotation | null> {
  if (isDatabaseConfigured()) {
    return getAnnotationForPromptFromDb(runId, promptNumber);
  }
  return getAnnotationForPrompt(runId, promptNumber);
}

export function saveAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): Annotation {
  // Sync version - file only, always creates new (no upsert)
  const annotations = getAnnotationsFromFile();
  const now = new Date().toISOString();

  const newAnnotation: Annotation = {
    id: `${annotation.runId}-v${annotation.promptNumber}-${Date.now()}`,
    ...annotation,
    author: annotation.author || 'human',
    createdAt: now,
    updatedAt: now
  };
  annotations.push(newAnnotation);
  saveAnnotationsToFile(annotations);
  return newAnnotation;
}

export async function saveAnnotationAsync(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Annotation> {
  if (isDatabaseConfigured()) {
    return saveAnnotationToDb(annotation);
  }
  // For file-based, if id provided, find and update
  if (annotation.id) {
    const annotations = getAnnotationsFromFile();
    const idx = annotations.findIndex(a => a.id === annotation.id);
    if (idx >= 0) {
      const updated: Annotation = {
        ...annotations[idx],
        issueType: annotation.issueType,
        severity: annotation.severity,
        note: annotation.note,
        updatedAt: new Date().toISOString()
      };
      annotations[idx] = updated;
      saveAnnotationsToFile(annotations);
      return updated;
    }
  }
  return saveAnnotation(annotation);
}

export function deleteAnnotation(runId: string, promptNumber: number): boolean {
  const annotations = getAnnotationsFromFile();
  const filtered = annotations.filter(
    a => !(a.runId === runId && a.promptNumber === promptNumber)
  );

  if (filtered.length === annotations.length) return false;

  saveAnnotationsToFile(filtered);
  return true;
}

export async function deleteAnnotationAsync(runId: string, promptNumber: number): Promise<boolean> {
  if (isDatabaseConfigured()) {
    return deleteAnnotationFromDb(runId, promptNumber);
  }
  return deleteAnnotation(runId, promptNumber);
}

export async function deleteAnnotationByIdAsync(annotationId: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    return deleteAnnotationByIdFromDb(annotationId);
  }
  // File-based fallback
  const annotations = getAnnotationsFromFile();
  const filtered = annotations.filter(a => a.id !== annotationId);
  if (filtered.length === annotations.length) return false;
  saveAnnotationsToFile(filtered);
  return true;
}

export function getAnnotationsForPrompt(runId: string, promptNumber: number): Annotation[] {
  return getAnnotations().filter(a => a.runId === runId && a.promptNumber === promptNumber);
}

export async function getAnnotationsForPromptAsync(runId: string, promptNumber: number): Promise<Annotation[]> {
  if (isDatabaseConfigured()) {
    return getAnnotationsForPromptFromDb(runId, promptNumber);
  }
  return getAnnotationsForPrompt(runId, promptNumber);
}

// Get all annotations grouped by issue type for reporting
export function getAnnotationsByIssueType(): Record<IssueType, Annotation[]> {
  const annotations = getAnnotations();
  const grouped: Record<IssueType, Annotation[]> = {
    'context-lost': [],
    'style-drift': [],
    'text-broken': [],
    'data-deleted': [],
    'wrong-output': [],
    'other': []
  };

  annotations.forEach(a => {
    if (grouped[a.issueType]) {
      grouped[a.issueType].push(a);
    }
  });

  return grouped;
}

// Get high-severity annotations for the hit list
export function getCriticalAnnotations(): Annotation[] {
  return getAnnotations().filter(a => a.severity === 'high');
}
