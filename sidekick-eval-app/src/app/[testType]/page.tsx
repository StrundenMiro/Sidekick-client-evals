import Link from 'next/link';
import { getFormatsByTestType, isScored, getRunRating } from '@/lib/runs';
import { getTestType } from '@/lib/test-types';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import RatingBadge from '@/components/RatingBadge';

const FORMAT_ORDER = ['table', 'stickies', 'document', 'prototype', 'flowchart', 'slides', 'image', 'diagram_erd', 'diagram_mindmap'];

export default async function TestTypePage({ params }: { params: Promise<{ testType: string }> }) {
  const { testType } = await params;
  const testTypeInfo = getTestType(testType);

  if (!testTypeInfo) {
    notFound();
  }

  const formats = getFormatsByTestType(testType);
  const formatList = FORMAT_ORDER
    .filter(f => formats[f])
    .map(f => {
      const { runs, latest } = formats[f];
      const latestRating = getRunRating(latest);
      return {
        id: f,
        name: f.replace('_', ' '),
        runCount: runs.length,
        latestRating,
        latestDate: latest.timestamp
      };
    });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/' },
          { label: testTypeInfo.shortName }
        ]} />

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{testTypeInfo.name}</h1>
          <p className="text-gray-500 mt-1">{testTypeInfo.description}</p>
        </header>

        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Formats
          </h2>
          {formatList.length > 0 ? (
            <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {formatList.map(format => (
                <li key={format.id}>
                  <Link
                    href={`/${testType}/${format.id}`}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">{format.name}</h3>
                        <p className="text-sm text-gray-500">
                          {format.runCount} run{format.runCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <RatingBadge rating={format.latestRating} size="sm" />
                        <span className="text-gray-300">&rarr;</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              No test runs yet for this test type.
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Evaluation Focus
          </h2>
          <ul className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            {testTypeInfo.evaluationFocus.map((focus, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-gray-400">&bull;</span>
                {focus}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
