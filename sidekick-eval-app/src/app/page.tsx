import Link from 'next/link';
import { getRunsByTestTypeAsync, isScored, getRunRating } from '@/lib/runs';
import { getAllTestTypes } from '@/lib/test-types';
import { getAnnotationsAsync } from '@/lib/annotations';

export default async function Dashboard() {
  const runsByTestType = await getRunsByTestTypeAsync();
  const testTypes = getAllTestTypes();
  const annotations = await getAnnotationsAsync();

  // Count annotations by severity
  const highSeverityCount = annotations.filter(a => a.severity === 'high').length;
  const mediumSeverityCount = annotations.filter(a => a.severity === 'medium').length;

  // Calculate stats for each test type
  const stats = testTypes.map(tt => {
    const runs = runsByTestType[tt.id] || [];
    const scoredRuns = runs.filter(isScored);
    const formats = new Set(runs.map(r => r.format)).size;

    const ratings = scoredRuns.map(r => getRunRating(r));
    const passCount = ratings.filter(r => r === 'great').length;
    const failCount = ratings.filter(r => r === 'bad').length;

    return {
      ...tt,
      runCount: runs.length,
      formatCount: formats,
      passCount,
      failCount,
      passRate: scoredRuns.length > 0 ? Math.round((passCount / scoredRuns.length) * 100) : 0
    };
  });

  // Sort by urgency: failures first, then by fail count
  const activeTests = stats
    .filter(tt => tt.runCount > 0)
    .sort((a, b) => b.failCount - a.failCount);

  const comingSoon = stats.filter(tt => tt.runCount === 0);

  // Calculate totals
  const totalRuns = activeTests.reduce((sum, tt) => sum + tt.runCount, 0);
  const totalFails = activeTests.reduce((sum, tt) => sum + tt.failCount, 0);
  const totalPasses = activeTests.reduce((sum, tt) => sum + tt.passCount, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">

        {/* Compact Frank Header */}
        <header className="flex items-center gap-3 py-4 mb-6 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm flex-shrink-0">
            🤖
          </div>
          <p className="text-sm text-gray-500">
            <strong className="text-gray-700">Frank&apos;s Evals</strong> — I test Sidekick the way a product builder (EPD) would. Plain prompts, real expectations.
          </p>
        </header>

        {/* Issues Summary Link */}
        {annotations.length > 0 && (
          <Link
            href="/issues"
            className="flex items-center justify-between mb-6 py-3 px-4 bg-white rounded-lg border border-gray-200 text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <span className="text-gray-500">
                <strong className="text-gray-900">{annotations.length}</strong> annotations across <strong className="text-gray-900">{totalRuns}</strong> runs
              </span>
              {highSeverityCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                  {highSeverityCount} high
                </span>
              )}
              {mediumSeverityCount > 0 && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                  {mediumSeverityCount} medium
                </span>
              )}
            </div>
            <span className="text-gray-400 group-hover:text-gray-600">
              View all issues →
            </span>
          </Link>
        )}

        {/* Test Types (sorted by urgency) */}
        {activeTests.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Frank&apos;s Test Runs
            </h2>
            <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {activeTests.map(tt => (
                <li key={tt.id}>
                  <Link
                    href={`/${tt.id}`}
                    className="block px-4 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{tt.name}</h3>
                          {tt.failCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              {tt.failCount} fail{tt.failCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {tt.formatCount} format{tt.formatCount !== 1 ? 's' : ''} • {tt.runCount} run{tt.runCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="ml-4 px-3 py-1 text-sm text-gray-500 group-hover:text-gray-900 group-hover:bg-gray-100 rounded transition-colors">
                        Open →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Coming Soon - Collapsed */}
        {comingSoon.length > 0 && (
          <details className="mb-8 group">
            <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-500 list-none flex items-center gap-2">
              <span className="text-gray-300 group-open:rotate-90 transition-transform">▶</span>
              Coming Soon ({comingSoon.length})
            </summary>
            <ul className="mt-3 space-y-2">
              {comingSoon.map(tt => (
                <li key={tt.id} className="px-4 py-3 bg-gray-50 rounded-lg text-gray-400">
                  <span className="font-medium">{tt.name}</span>
                  <span className="text-sm ml-2">— {tt.description}</span>
                </li>
              ))}
            </ul>
          </details>
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
