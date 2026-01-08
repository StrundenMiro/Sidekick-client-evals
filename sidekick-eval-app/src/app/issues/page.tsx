import Link from 'next/link';
import { getAnnotationsAsync } from '@/lib/annotations';
import { getRunsAsync, getRunTestType } from '@/lib/runs';
import { getPlannedFixesAsync } from '@/lib/plannedFixes';
import IssuesClient, { EnrichedIssue } from './IssuesClient';

export const dynamic = 'force-dynamic';

export default async function IssuesPage() {
  const [annotations, runs, plannedFixes] = await Promise.all([
    getAnnotationsAsync(),
    getRunsAsync(),
    getPlannedFixesAsync()
  ]);

  // Create a map of runs by ID for quick lookup
  const runsMap = new Map(runs.map(run => [run.id, run]));

  // Enrich each annotation with run data
  const enrichedIssues: EnrichedIssue[] = annotations
    .map(annotation => {
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
        createdAt: annotation.createdAt,
        plannedFixId: annotation.plannedFixId || null,
        owner: annotation.owner || null
      } as EnrichedIssue;
    })
    .filter((issue): issue is EnrichedIssue => issue !== null);

  // Sort by severity (high first), then by date (newest first)
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, good: 3 };
  enrichedIssues.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <span>←</span> Back to Dashboard
          </Link>
        </nav>

        <IssuesClient issues={enrichedIssues} totalRuns={runs.length} plannedFixes={plannedFixes} />
      </div>
    </div>
  );
}
