import Link from 'next/link';
import { getRunsAsync, getRunTestType } from '@/lib/runs';
import { getAnnotationsAsync } from '@/lib/annotations';
import { getPlannedFixesAsync } from '@/lib/plannedFixes';
import FormatIcon from '@/components/FormatIcon';
import RecentRuns from '@/components/RecentRuns';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [runs, annotations, plannedFixes] = await Promise.all([
    getRunsAsync(),
    getAnnotationsAsync(),
    getPlannedFixesAsync()
  ]);

  // Get resolved fix IDs
  const resolvedFixIds = new Set(plannedFixes.filter(f => f.resolved).map(f => f.id));

  // Get unique formats and their stats
  const formatStats = new Map<string, {
    name: string;
    criticalCount: number;
    majorCount: number;
    needTriageCount: number;
    runCount: number;
    useCases: Set<string>;
  }>();

  // Initialize formats from runs
  runs.forEach(run => {
    if (!formatStats.has(run.format)) {
      formatStats.set(run.format, {
        name: run.format,
        criticalCount: 0,
        majorCount: 0,
        needTriageCount: 0,
        runCount: 0,
        useCases: new Set()
      });
    }
    const stats = formatStats.get(run.format)!;
    stats.runCount++;

    // Determine use-case (greenfield vs brownfield)
    const testType = getRunTestType(run);
    const useCase = testType === 'existing-content-iteration' ? 'brownfield' : 'greenfield';
    stats.useCases.add(useCase);
  });

  // Count issues per format from annotations
  annotations.forEach(annotation => {
    const run = runs.find(r => r.id === annotation.runId);
    if (!run) return;

    const stats = formatStats.get(run.format);
    if (!stats) return;

    if (annotation.severity === 'high') {
      stats.criticalCount++;
    } else if (annotation.severity === 'medium') {
      stats.majorCount++;
    }

    // Count need triage (not praise, not assigned to resolved fix)
    if (annotation.severity !== 'good') {
      if (!annotation.plannedFixId || !resolvedFixIds.has(annotation.plannedFixId)) {
        stats.needTriageCount++;
      }
    }
  });

  // Define which formats are diagram types (will be prefixed with "Diagram - ")
  const diagramFormats = new Set(['flowchart', 'erd', 'mindmap', 'diagram']);

  // Convert to sorted array with display names
  const allFormats = Array.from(formatStats.values())
    .map(f => ({
      ...f,
      displayName: diagramFormats.has(f.name.toLowerCase())
        ? `Diagram - ${f.name.charAt(0).toUpperCase() + f.name.slice(1)}`
        : f.name
    }))
    .sort((a, b) => b.displayName.localeCompare(a.displayName));

  // Total counts
  const totalCritical = allFormats.reduce((sum, f) => sum + f.criticalCount, 0);
  const totalMajor = allFormats.reduce((sum, f) => sum + f.majorCount, 0);
  const totalAnnotations = annotations.length;

  // Count unassigned issues (not praise, not assigned to a fix, or assigned to unresolved fix)
  const unassignedCount = annotations.filter(a => {
    // Skip praise (good severity)
    if (a.severity === 'good') return false;
    // Count if no fix assigned, or fix is not resolved
    return !a.plannedFixId || !resolvedFixIds.has(a.plannedFixId);
  }).length;

  // Count issues per run (excluding praise)
  const issueCountByRun = new Map<string, number>();
  annotations.forEach(a => {
    if (a.severity !== 'good') {
      issueCountByRun.set(a.runId, (issueCountByRun.get(a.runId) || 0) + 1);
    }
  });

  // Prepare recent runs sorted by timestamp (newest first)
  const recentRuns = runs
    .map(run => {
      // Get description from summary or first prompt title
      let description = '';
      if ('summary' in run && run.summary) {
        description = run.summary;
      } else if ('prompts' in run && run.prompts.length > 0) {
        description = run.prompts[0].title;
      }

      return {
        id: run.id,
        format: run.format,
        timestamp: run.timestamp,
        issueCount: issueCountByRun.get(run.id) || 0,
        testType: getRunTestType(run),
        description
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">

        {/* Compact Frank Header */}
        <header className="flex items-center gap-3 py-4 mb-6 border-b border-gray-200">
          <div className="text-2xl flex-shrink-0">
            🤖
          </div>
          <p className="text-sm text-gray-500">
            <strong className="text-gray-700">Frank&apos;s Evals</strong> — I test AI Workflows the way a product builder (EPD) would. Plain prompts, real expectations.
          </p>
        </header>

        {/* All Issues Overview */}
        {totalAnnotations > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              All Issues
            </h2>
            <Link
              href="/issues"
              className="flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500">📋</span>
                <span className="font-medium text-gray-900">Issues Overview</span>
              </div>
              <div className="flex items-center gap-3">
                {unassignedCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                    {unassignedCount} need triage
                  </span>
                )}
                {totalCritical > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500 group-hover:bg-red-100 group-hover:text-red-700 transition-colors">
                    {totalCritical} critical
                  </span>
                )}
                {totalMajor > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                    {totalMajor} major
                  </span>
                )}
                <span className="text-xs text-gray-400 w-14 text-right">{totalAnnotations} total</span>
              </div>
            </Link>
          </section>
        )}

        {/* Formats List */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Issues by Format
          </h2>
          <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {allFormats.map(format => (
              <li key={format.name}>
                <Link
                  href={`/format/${format.name}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <FormatIcon format={format.name} size={18} />
                    <span className="font-medium text-gray-900 capitalize">{format.displayName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {format.needTriageCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                        {format.needTriageCount} need triage
                      </span>
                    )}
                    {format.criticalCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500 group-hover:bg-red-100 group-hover:text-red-700 transition-colors">
                        {format.criticalCount} critical
                      </span>
                    )}
                    {format.majorCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                        {format.majorCount} major
                      </span>
                    )}
                    <span className="text-xs text-gray-400 w-14 text-right">{format.runCount} runs</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent Runs */}
        {recentRuns.length > 0 && (
          <RecentRuns runs={recentRuns} />
        )}

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          Questions?{' '}
          <a
            href="https://miro.slack.com/team/U02T7A92DRA"
            className="text-blue-600 hover:underline"
          >
            Message Fabian
          </a>
        </footer>
      </div>
    </main>
  );
}
