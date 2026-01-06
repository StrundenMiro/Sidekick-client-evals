import Link from 'next/link';
import { getRunsByTestTypeAndFormat, isScored, isCapturing, getRunRating, type Run } from '@/lib/runs';
import { getTestType } from '@/lib/test-types';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import RatingBadge from '@/components/RatingBadge';

function getStateLabel(run: Run): { text: string; className: string } {
  if (!('state' in run)) {
    return { text: 'Scored', className: 'bg-green-100 text-green-700' };
  }
  switch (run.state) {
    case 'capturing':
      return { text: 'Capturing', className: 'bg-blue-100 text-blue-700' };
    case 'captured':
      return { text: 'Pending Score', className: 'bg-yellow-100 text-yellow-700' };
    case 'scored':
      return { text: 'Scored', className: 'bg-green-100 text-green-700' };
    default:
      return { text: 'Unknown', className: 'bg-gray-100 text-gray-700' };
  }
}

export default async function FormatPage({ params }: { params: Promise<{ testType: string; format: string }> }) {
  const { testType, format } = await params;
  const testTypeInfo = getTestType(testType);

  if (!testTypeInfo) {
    notFound();
  }

  const runs = getRunsByTestTypeAndFormat(testType, format);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <Breadcrumbs items={[
          { label: 'Frank', href: '/' },
          { label: testTypeInfo.shortName, href: `/${testType}` },
          { label: format.replace('_', ' ') }
        ]} />

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{format.replace('_', ' ')}</h1>
          <p className="text-gray-500 mt-1">{runs.length} test run{runs.length !== 1 ? 's' : ''}</p>
        </header>

        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Runs
          </h2>
          {runs.length > 0 ? (
            <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {runs.map(run => {
                const stateLabel = getStateLabel(run);

                return (
                  <li key={run.id}>
                    <Link
                      href={`/${testType}/${format}/${run.id}`}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{run.id}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${stateLabel.className}`}>
                              {stateLabel.text}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {new Date(run.timestamp).toLocaleString()}
                            {isCapturing(run) && ` • ${run.prompts.length}/3 prompts`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <RatingBadge rating={getRunRating(run)} size="sm" />
                          <span className="text-gray-300">&rarr;</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              No test runs yet for this format.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
