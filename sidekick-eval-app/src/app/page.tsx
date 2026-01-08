import Link from 'next/link';
import { getRunsAsync, getRunTestType } from '@/lib/runs';
import { getAnnotationsAsync } from '@/lib/annotations';
import FormatIcon from '@/components/FormatIcon';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [runs, annotations] = await Promise.all([
    getRunsAsync(),
    getAnnotationsAsync()
  ]);

  // Get unique formats and their stats
  const formatStats = new Map<string, {
    name: string;
    criticalCount: number;
    majorCount: number;
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
  });

  // Convert to sorted array
  const formats = Array.from(formatStats.values())
    .sort((a, b) => {
      // Sort by critical count first, then major, then alphabetically
      if (a.criticalCount !== b.criticalCount) return b.criticalCount - a.criticalCount;
      if (a.majorCount !== b.majorCount) return b.majorCount - a.majorCount;
      return a.name.localeCompare(b.name);
    });

  // Total counts
  const totalCritical = formats.reduce((sum, f) => sum + f.criticalCount, 0);
  const totalMajor = formats.reduce((sum, f) => sum + f.majorCount, 0);
  const totalAnnotations = annotations.length;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">

        {/* Compact Frank Header */}
        <header className="flex items-center gap-3 py-4 mb-6 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm flex-shrink-0">
            🤖
          </div>
          <p className="text-sm text-gray-500">
            <strong className="text-gray-700">Frank&apos;s Evals</strong> — I test AI Workflows the way a product builder (EPD) would. Plain prompts, real expectations.
          </p>
        </header>

        {/* Summary Stats */}
        {totalAnnotations > 0 && (
          <div className="mb-6 flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              <strong className="text-gray-900">{totalAnnotations}</strong> issues found
            </span>
            {totalCritical > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                {totalCritical} critical
              </span>
            )}
            {totalMajor > 0 && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                {totalMajor} major
              </span>
            )}
            <Link
              href="/issues"
              className="ml-auto text-gray-400 hover:text-gray-600 text-xs"
            >
              View all →
            </Link>
          </div>
        )}

        {/* Formats List */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Formats
          </h2>
          <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {formats.map(format => (
              <li key={format.name}>
                <Link
                  href={`/format/${format.name}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <FormatIcon format={format.name} size={18} />
                    <span className="font-medium text-gray-900 capitalize">{format.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
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
