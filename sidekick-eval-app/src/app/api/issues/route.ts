import { NextResponse } from 'next/server';
import { getAnnotationsAsync, Annotation, Severity, IssueType } from '@/lib/annotations';
import { getRunsAsync, Run, getRunTestType } from '@/lib/runs';

export interface EnrichedIssue {
  id: string;
  runId: string;
  promptNumber: number;
  note: string;
  severity: Severity;
  issueType: IssueType;
  author: 'frank' | 'human';
  testType: 'greenfield' | 'brownfield';
  format: string;
  artifactPath: string;
  link: string;
  createdAt: string;
}

export async function GET() {
  try {
    const [annotations, runs] = await Promise.all([
      getAnnotationsAsync(),
      getRunsAsync()
    ]);

    // Create a map of runs by ID for quick lookup
    const runsMap = new Map<string, Run>();
    runs.forEach(run => runsMap.set(run.id, run));

    // Enrich each annotation with run data
    const enrichedIssues: EnrichedIssue[] = annotations
      .map((annotation: Annotation) => {
        const run = runsMap.get(annotation.runId);
        if (!run) return null;

        const testTypeRaw = getRunTestType(run);
        const testType: 'greenfield' | 'brownfield' =
          testTypeRaw === 'existing-content-iteration' ? 'brownfield' : 'greenfield';

        return {
          id: annotation.id,
          runId: annotation.runId,
          promptNumber: annotation.promptNumber,
          note: annotation.note,
          severity: annotation.severity,
          issueType: annotation.issueType,
          author: annotation.author,
          testType,
          format: run.format,
          artifactPath: `/artifacts/${annotation.runId}/v${annotation.promptNumber}.png`,
          link: `/${testTypeRaw}/${run.format}/${annotation.runId}#v${annotation.promptNumber}`,
          createdAt: annotation.createdAt
        };
      })
      .filter((issue): issue is EnrichedIssue => issue !== null);

    // Sort by severity (high first), then by date (newest first)
    const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2, good: 3 };
    enrichedIssues.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      issues: enrichedIssues,
      totalRuns: runs.length
    });
  } catch (error) {
    console.error('Error fetching enriched issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}
