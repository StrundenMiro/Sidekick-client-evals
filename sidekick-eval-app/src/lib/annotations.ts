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

// Image marker for positioned annotations on artifacts
export interface ImageMarker {
  x: number;      // percentage (0-100) from left
  y: number;      // percentage (0-100) from top
  label?: string; // optional short label (e.g., "A", "1")
}

// Annotation target types (simplified)
export type AnnotationTarget =
  | { type: 'message' }                    // Tags the whole message
  | { type: 'image'; marker: ImageMarker } // Position on artifact
  | { type: 'general' };                   // Legacy: no specific target

// Legacy types for backward compatibility (deprecated)
export type ContentType = 'prompt' | 'response';
export interface TextHighlight {
  contentType: ContentType;
  startOffset: number;
  endOffset: number;
  highlightedText: string;
}

// Severity display configuration (maps internal values to user-facing labels)
export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; order: number }> = {
  high: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100', order: 0 },
  medium: { label: 'Major', color: 'text-orange-700', bg: 'bg-orange-100', order: 1 },
  low: { label: 'Minor', color: 'text-blue-700', bg: 'bg-blue-100', order: 2 },
  good: { label: 'Good', color: 'text-green-700', bg: 'bg-green-100', order: 3 }
};

export interface Annotation {
  id: string;
  runId: string;
  messageId: number;              // ID of the message being annotated
  promptNumber: number;           // Legacy: kept for backward compatibility
  author: Author;
  issueType: IssueType;
  severity: Severity;
  note: string;
  plannedFixId: string | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  target?: AnnotationTarget;      // Where the annotation points to
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
  message_id: number;               // ID of the message being annotated
  prompt_number: number;            // Legacy: kept for backward compatibility
  author: string;
  issue_type: string;
  severity: string;
  note: string;
  planned_fix_id: string | null;
  owner: string | null;
  created_at: Date;
  updated_at: Date;
  // Target fields
  target_type: string | null;       // 'message', 'image', or null (general)
  marker_x: number | null;          // image marker x position (0-100)
  marker_y: number | null;          // image marker y position (0-100)
  marker_label: string | null;      // image marker label
  // Legacy fields (deprecated, kept for backward compat)
  content_type: string | null;
  start_offset: number | null;
  end_offset: number | null;
  highlighted_text: string | null;
}

function dbToAnnotation(row: DbAnnotation): Annotation {
  // Build target based on target_type
  let target: AnnotationTarget | undefined;
  if (row.target_type === 'message') {
    target = { type: 'message' };
  } else if (row.target_type === 'image' && row.marker_x !== null && row.marker_y !== null) {
    target = {
      type: 'image',
      marker: {
        x: row.marker_x,
        y: row.marker_y,
        ...(row.marker_label ? { label: row.marker_label } : {})
      }
    };
  } else if (row.target_type === 'general' || row.target_type === 'text') {
    // Treat legacy 'text' targets as 'message' (whole message annotation)
    target = { type: 'message' };
  }

  return {
    id: row.id,
    runId: row.run_id,
    messageId: row.message_id || row.prompt_number, // Fall back to prompt_number for legacy
    promptNumber: row.prompt_number,
    author: (row.author || 'human') as Author,
    issueType: row.issue_type as IssueType,
    severity: row.severity as Severity,
    note: row.note || '',
    plannedFixId: row.planned_fix_id,
    owner: row.owner,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    ...(target ? { target } : {})
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

  // Extract target fields (simplified)
  const target = annotation.target;
  const targetType = target?.type || 'message';
  const markerX = target?.type === 'image' ? target.marker.x : null;
  const markerY = target?.type === 'image' ? target.marker.y : null;
  const markerLabel = target?.type === 'image' ? target.marker.label || null : null;

  // Use messageId, fall back to promptNumber for legacy
  const messageId = annotation.messageId || annotation.promptNumber;

  // If we have an ID, update existing annotation
  if (annotation.id) {
    const row = await queryOne<DbAnnotation>(`
      UPDATE annotations SET
        issue_type = $1,
        severity = $2,
        note = $3,
        planned_fix_id = $4,
        owner = $5,
        updated_at = $6,
        target_type = $7,
        marker_x = $8,
        marker_y = $9,
        marker_label = $10,
        message_id = $11
      WHERE id = $12
      RETURNING *
    `, [annotation.issueType, annotation.severity, annotation.note, annotation.plannedFixId, annotation.owner, now,
        targetType, markerX, markerY, markerLabel, messageId, annotation.id]);
    return dbToAnnotation(row!);
  }

  // Otherwise create new annotation
  const id = `${annotation.runId}-m${messageId}-${Date.now()}`;
  const row = await queryOne<DbAnnotation>(`
    INSERT INTO annotations (id, run_id, message_id, prompt_number, author, issue_type, severity, note, planned_fix_id, owner, created_at, updated_at,
      target_type, marker_x, marker_y, marker_label)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12, $13, $14, $15)
    RETURNING *
  `, [id, annotation.runId, messageId, annotation.promptNumber, annotation.author || 'human', annotation.issueType, annotation.severity, annotation.note, annotation.plannedFixId, annotation.owner, now,
      targetType, markerX, markerY, markerLabel]);

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
  const messageId = annotation.messageId || annotation.promptNumber;

  const newAnnotation: Annotation = {
    id: `${annotation.runId}-m${messageId}-${Date.now()}`,
    ...annotation,
    messageId,
    author: annotation.author || 'human',
    plannedFixId: annotation.plannedFixId || null,
    owner: annotation.owner || null,
    createdAt: now,
    updatedAt: now,
    ...(annotation.target ? { target: annotation.target } : { target: { type: 'message' } })
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
        plannedFixId: annotation.plannedFixId ?? annotations[idx].plannedFixId,
        owner: annotation.owner ?? annotations[idx].owner,
        updatedAt: new Date().toISOString(),
        ...(annotation.target ? { target: annotation.target } : {})
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
