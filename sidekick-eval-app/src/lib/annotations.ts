import fs from 'fs';
import path from 'path';

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
export type Severity = 'high' | 'medium' | 'low';

export interface Annotation {
  id: string;
  runId: string;
  promptNumber: number;
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

// Ensure the file exists
function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ annotations: [] }, null, 2));
  }
}

export function getAnnotations(): Annotation[] {
  ensureDataFile();
  const data = fs.readFileSync(DATA_PATH, 'utf-8');
  const parsed: AnnotationsData = JSON.parse(data);
  return parsed.annotations;
}

export function getAnnotationsForRun(runId: string): Annotation[] {
  return getAnnotations().filter(a => a.runId === runId);
}

export function getAnnotationForPrompt(runId: string, promptNumber: number): Annotation | null {
  const annotations = getAnnotations();
  return annotations.find(a => a.runId === runId && a.promptNumber === promptNumber) || null;
}

export function saveAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): Annotation {
  ensureDataFile();
  const annotations = getAnnotations();

  // Check if annotation already exists for this run+prompt
  const existingIdx = annotations.findIndex(
    a => a.runId === annotation.runId && a.promptNumber === annotation.promptNumber
  );

  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    // Update existing
    const updated: Annotation = {
      ...annotations[existingIdx],
      ...annotation,
      updatedAt: now
    };
    annotations[existingIdx] = updated;
    fs.writeFileSync(DATA_PATH, JSON.stringify({ annotations }, null, 2));
    return updated;
  } else {
    // Create new
    const newAnnotation: Annotation = {
      id: `${annotation.runId}-v${annotation.promptNumber}-${Date.now()}`,
      ...annotation,
      createdAt: now,
      updatedAt: now
    };
    annotations.push(newAnnotation);
    fs.writeFileSync(DATA_PATH, JSON.stringify({ annotations }, null, 2));
    return newAnnotation;
  }
}

export function deleteAnnotation(runId: string, promptNumber: number): boolean {
  ensureDataFile();
  const annotations = getAnnotations();
  const filtered = annotations.filter(
    a => !(a.runId === runId && a.promptNumber === promptNumber)
  );

  if (filtered.length === annotations.length) return false;

  fs.writeFileSync(DATA_PATH, JSON.stringify({ annotations: filtered }, null, 2));
  return true;
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
