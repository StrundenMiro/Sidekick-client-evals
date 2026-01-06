import Link from 'next/link';
import { getRunsByTestType, isScored, getRunRating, getAllIssues } from '@/lib/runs';
import { getAllTestTypes } from '@/lib/test-types';
import RatingBadge from '@/components/RatingBadge';

export default function Dashboard() {
  const runsByTestType = getRunsByTestType();
  const testTypes = getAllTestTypes();
  const themes = getAllIssues();
  const highPriorityCount = themes.filter(t => t.severity === 'high').length;

  // Calculate stats for each test type
  const stats = testTypes.map(tt => {
    const runs = runsByTestType[tt.id] || [];
    const scoredRuns = runs.filter(isScored);
    const formats = new Set(runs.map(r => r.format)).size;

    // Count ratings
    const ratings = scoredRuns.map(r => getRunRating(r));
    const greatCount = ratings.filter(r => r === 'great').length;
    const goodCount = ratings.filter(r => r === 'good').length;
    const badCount = ratings.filter(r => r === 'bad').length;

    return {
      ...tt,
      runCount: runs.length,
      formatCount: formats,
      greatCount,
      goodCount,
      badCount
    };
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6 pt-10">
        <header className="mb-10">
          <div className="flex gap-4 items-center">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl flex-shrink-0">
              🤖
            </div>
            <p className="text-gray-600 text-base leading-relaxed">
              Hey, I&apos;m <strong className="text-gray-700">Frank</strong> &mdash; a testing buddy emulating product teams who want to give AI a real shot. I&apos;m not a prompt engineer, so I just write what I expect to get. If it doesn&apos;t work, you&apos;ll hear about it.
            </p>
          </div>
        </header>

        {/* Frank's Hit List - Quick Access */}
        <Link
          href="/hit-list"
          className="block mb-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-lg p-4 hover:from-red-100 hover:to-orange-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h2 className="font-semibold text-gray-900">Issues I Found</h2>
                <p className="text-sm text-gray-600">
                  {themes.length} issue{themes.length !== 1 ? 's' : ''} • {highPriorityCount} critical
                </p>
              </div>
            </div>
            <span className="text-gray-400">&rarr;</span>
          </div>
        </Link>

        {/* Test types with runs */}
        {stats.filter(tt => tt.runCount > 0).length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Test Types
            </h2>
            <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {stats.filter(tt => tt.runCount > 0).map(tt => (
                <li key={tt.id}>
                  <Link
                    href={`/${tt.id}`}
                    className="block px-4 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{tt.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{tt.description}</p>
                      </div>
                      <div className="ml-4 flex items-center gap-4 text-sm text-gray-500">
                        <span>{tt.formatCount} format{tt.formatCount !== 1 ? 's' : ''}</span>
                        <span>{tt.runCount} run{tt.runCount !== 1 ? 's' : ''}</span>
                        {(tt.greatCount > 0 || tt.goodCount > 0 || tt.badCount > 0) && (
                          <span className="flex gap-1">
                            {tt.greatCount > 0 && <span className="text-green-600">{tt.greatCount} great</span>}
                            {tt.goodCount > 0 && <span className="text-yellow-600">{tt.goodCount} good</span>}
                            {tt.badCount > 0 && <span className="text-red-600">{tt.badCount} bad</span>}
                          </span>
                        )}
                        <span className="text-gray-300">&rarr;</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Empty test types - shown as non-clickable */}
        {stats.filter(tt => tt.runCount === 0).length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              Coming Soon
            </h2>
            <ul className="space-y-2">
              {stats.filter(tt => tt.runCount === 0).map(tt => (
                <li key={tt.id} className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                  <h3 className="font-medium text-gray-400">{tt.name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{tt.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          Questions & Feedback?{' '}
          <a
            href="slack://user?team=T024VA4H2&id=U024VNR1Q"
            className="text-blue-600 hover:underline"
          >
            Message Fabian
          </a>
        </footer>
      </div>
    </main>
  );
}
