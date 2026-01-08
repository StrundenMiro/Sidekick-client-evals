import Link from 'next/link';
import { getRunsByTestTypeAsync, isScored, getRunRating, getAllIssuesAsync } from '@/lib/runs';
import { getAllTestTypes } from '@/lib/test-types';

export default async function Dashboard() {
  const runsByTestType = await getRunsByTestTypeAsync();
  const testTypes = getAllTestTypes();
  const issues = await getAllIssuesAsync();
  const criticalIssues = issues.filter(t => t.severity === 'high');

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

        {/* Critical Issues Hero */}
        {criticalIssues.length > 0 ? (
          <Link
            href="/hit-list"
            className="block mb-8 bg-red-50 border-2 border-red-200 rounded-xl p-5 hover:bg-red-100 hover:border-red-300 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded uppercase">
                    {criticalIssues.length} Critical
                  </span>
                  {issues.length > criticalIssues.length && (
                    <span className="text-sm text-gray-500">
                      + {issues.length - criticalIssues.length} other issue{issues.length - criticalIssues.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {criticalIssues.slice(0, 2).map(issue => (
                    <div key={issue.id}>
                      <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                      <p className="text-sm text-gray-600">
                        Affects {issue.affectedFormats.length} format{issue.affectedFormats.length !== 1 ? 's' : ''}: {issue.affectedFormats.join(', ')}
                      </p>
                    </div>
                  ))}
                  {criticalIssues.length > 2 && (
                    <p className="text-sm text-red-600">+ {criticalIssues.length - 2} more critical</p>
                  )}
                </div>
              </div>

              <span className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg group-hover:bg-red-700 transition-colors">
                Review →
              </span>
            </div>
          </Link>
        ) : issues.length > 0 ? (
          <Link
            href="/hit-list"
            className="block mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h2 className="font-semibold text-gray-900">{issues.length} Issue{issues.length !== 1 ? 's' : ''} Found</h2>
                  <p className="text-sm text-gray-600">No critical issues, but worth reviewing</p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-lg group-hover:bg-yellow-700 transition-colors">
                View all →
              </span>
            </div>
          </Link>
        ) : (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <div>
                <h2 className="font-semibold text-gray-900">No Issues</h2>
                <p className="text-sm text-gray-600">All tests passing</p>
              </div>
            </div>
          </div>
        )}

        {/* Health Summary Strip */}
        <div className="flex items-center gap-6 mb-6 py-3 px-4 bg-white rounded-lg border border-gray-200 text-sm">
          <div>
            <span className="text-gray-500">Runs:</span>{' '}
            <span className="font-medium text-gray-900">{totalRuns}</span>
          </div>
          <div>
            <span className="text-gray-500">Pass:</span>{' '}
            <span className="font-medium text-green-600">{totalPasses}</span>
          </div>
          <div>
            <span className="text-gray-500">Fail:</span>{' '}
            <span className="font-medium text-red-600">{totalFails}</span>
          </div>
          {totalRuns > 0 && (
            <div className="ml-auto">
              <span className={`font-medium ${totalFails === 0 ? 'text-green-600' : totalFails > totalPasses ? 'text-red-600' : 'text-yellow-600'}`}>
                {Math.round((totalPasses / totalRuns) * 100)}% pass rate
              </span>
            </div>
          )}
        </div>

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
