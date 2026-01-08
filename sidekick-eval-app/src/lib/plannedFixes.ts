import fs from 'fs';
import path from 'path';
import { query, queryOne, isDatabaseConfigured } from './db';

export interface PlannedFix {
  id: string;
  name: string;
  jiraTicket: string | null;
  owner: string | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlannedFixesData {
  plannedFixes: PlannedFix[];
}

const DATA_PATH = path.join(process.cwd(), 'data', 'planned-fixes.json');

// ============================================
// File-based storage (fallback)
// ============================================

function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_PATH, JSON.stringify({ plannedFixes: [] }, null, 2));
  }
}

function getPlannedFixesFromFile(): PlannedFix[] {
  ensureDataFile();
  const data = fs.readFileSync(DATA_PATH, 'utf-8');
  const parsed: PlannedFixesData = JSON.parse(data);
  return parsed.plannedFixes;
}

function savePlannedFixesToFile(fixes: PlannedFix[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify({ plannedFixes: fixes }, null, 2));
}

// ============================================
// Database storage
// ============================================

interface DbPlannedFix {
  id: string;
  name: string;
  jira_ticket: string | null;
  owner: string | null;
  resolved: boolean;
  created_at: Date;
  updated_at: Date;
}

function dbToPlannedFix(row: DbPlannedFix): PlannedFix {
  return {
    id: row.id,
    name: row.name,
    jiraTicket: row.jira_ticket,
    owner: row.owner,
    resolved: row.resolved ?? false,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

async function getPlannedFixesFromDb(): Promise<PlannedFix[]> {
  const rows = await query<DbPlannedFix>(
    'SELECT * FROM planned_fixes ORDER BY name'
  );
  return rows.map(dbToPlannedFix);
}

async function getPlannedFixByIdFromDb(id: string): Promise<PlannedFix | null> {
  const row = await queryOne<DbPlannedFix>(
    'SELECT * FROM planned_fixes WHERE id = $1',
    [id]
  );
  return row ? dbToPlannedFix(row) : null;
}

async function savePlannedFixToDb(fix: Omit<PlannedFix, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<PlannedFix> {
  const now = new Date();

  if (fix.id) {
    const row = await queryOne<DbPlannedFix>(`
      UPDATE planned_fixes SET
        name = $1,
        jira_ticket = $2,
        owner = $3,
        resolved = $4,
        updated_at = $5
      WHERE id = $6
      RETURNING *
    `, [fix.name, fix.jiraTicket, fix.owner, fix.resolved ?? false, now, fix.id]);
    return dbToPlannedFix(row!);
  }

  const id = `fix-${Date.now()}`;
  const row = await queryOne<DbPlannedFix>(`
    INSERT INTO planned_fixes (id, name, jira_ticket, owner, resolved, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $6)
    RETURNING *
  `, [id, fix.name, fix.jiraTicket, fix.owner, fix.resolved ?? false, now]);

  return dbToPlannedFix(row!);
}

async function deletePlannedFixFromDb(id: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM planned_fixes WHERE id = $1 RETURNING id',
    [id]
  );
  return result.length > 0;
}

// ============================================
// Public API (auto-selects storage backend)
// ============================================

export async function getPlannedFixesAsync(): Promise<PlannedFix[]> {
  if (isDatabaseConfigured()) {
    return getPlannedFixesFromDb();
  }
  return getPlannedFixesFromFile();
}

export async function getPlannedFixByIdAsync(id: string): Promise<PlannedFix | null> {
  if (isDatabaseConfigured()) {
    return getPlannedFixByIdFromDb(id);
  }
  const fixes = getPlannedFixesFromFile();
  return fixes.find(f => f.id === id) || null;
}

export async function savePlannedFixAsync(fix: Omit<PlannedFix, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<PlannedFix> {
  if (isDatabaseConfigured()) {
    return savePlannedFixToDb(fix);
  }

  const fixes = getPlannedFixesFromFile();
  const now = new Date().toISOString();

  if (fix.id) {
    const idx = fixes.findIndex(f => f.id === fix.id);
    if (idx >= 0) {
      const updated: PlannedFix = {
        ...fixes[idx],
        name: fix.name,
        jiraTicket: fix.jiraTicket,
        owner: fix.owner,
        resolved: fix.resolved ?? false,
        updatedAt: now
      };
      fixes[idx] = updated;
      savePlannedFixesToFile(fixes);
      return updated;
    }
  }

  const newFix: PlannedFix = {
    id: `fix-${Date.now()}`,
    name: fix.name,
    jiraTicket: fix.jiraTicket,
    owner: fix.owner,
    resolved: fix.resolved ?? false,
    createdAt: now,
    updatedAt: now
  };
  fixes.push(newFix);
  savePlannedFixesToFile(fixes);
  return newFix;
}

export async function deletePlannedFixAsync(id: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    return deletePlannedFixFromDb(id);
  }
  const fixes = getPlannedFixesFromFile();
  const filtered = fixes.filter(f => f.id !== id);
  if (filtered.length === fixes.length) return false;
  savePlannedFixesToFile(filtered);
  return true;
}

// Get fix with issue count
export interface PlannedFixWithCount extends PlannedFix {
  issueCount: number;
}

export async function getPlannedFixesWithCountsAsync(annotationFixIds: string[]): Promise<PlannedFixWithCount[]> {
  const fixes = await getPlannedFixesAsync();
  const countMap = new Map<string, number>();

  annotationFixIds.forEach(fixId => {
    if (fixId) {
      countMap.set(fixId, (countMap.get(fixId) || 0) + 1);
    }
  });

  return fixes.map(fix => ({
    ...fix,
    issueCount: countMap.get(fix.id) || 0
  }));
}
