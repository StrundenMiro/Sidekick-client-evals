import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPlannedFixByIdAsync } from '@/lib/plannedFixes';
import { getAnnotationsAsync } from '@/lib/annotations';
import { getRunsAsync, getRunTestType } from '@/lib/runs';
import { getTestCategory, getTestCategoryShort } from '@/lib/test-types';
import FormatIcon from '@/components/FormatIcon';
import { getRelativeDate, formatFullDate } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

type Severity = 'high' | 'medium' | 'low' | 'good';

const severityConfig: Record<Severity, { label: string; color: string; bg: string }> = {
  high: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100' },
  medium: { label: 'Major', color: 'text-orange-700', bg: 'bg-orange-100' },
  low: { label: 'Minor', color: 'text-blue-700', bg: 'bg-blue-100' },
  good: { label: 'Good', color: 'text-green-700', bg: 'bg-green-100' }
};

interface PageProps {
  params: Promise<{ fixId: string }>;
}

export default async function FixDetailPage({ params }: PageProps) {
  const { fixId } = await params;

  const [fix, annotations, runs] = await Promise.all([
    getPlannedFixByIdAsync(fixId),
    getAnnotationsAsync(),
    getRunsAsync()
  ]);

  if (!fix) {
    notFound();
  }

  // Get annotations for this fix
  const fixAnnotations = annotations.filter(a => a.plannedFixId === fixId);

  // Create a map of runs by ID
  const runsMap = new Map(runs.map(r => [r.id, r]));

  // Enrich annotations with run data
  const enrichedAnnotations = fixAnnotations
    .map(annotation => {
      const run = runsMap.get(annotation.runId);
      if (!run) return null;

      const testTypeRaw = getRunTestType(run);
      const testType = getTestCategory(testTypeRaw);

      return {
        ...annotation,
        testType,
        testTypeRaw,
        format: run.format,
        artifactPath: `/artifacts/${annotation.runId}/v${annotation.promptNumber}.png`,
        link: `/${testTypeRaw}/${run.format}/${annotation.runId}#v${annotation.promptNumber}`
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Sort by severity first, then by date
      const sevOrder: Record<string, number> = { high: 0, medium: 1, low: 2, good: 3 };
      if (sevOrder[a!.severity] !== sevOrder[b!.severity]) {
        return sevOrder[a!.severity] - sevOrder[b!.severity];
      }
      return new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime();
    });

  // Count by severity
  const criticalCount = enrichedAnnotations.filter(a => a?.severity === 'high').length;
  const majorCount = enrichedAnnotations.filter(a => a?.severity === 'medium').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <span>&larr;</span> Back to Dashboard
          </Link>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚠</span>
            <h1 className="text-2xl font-bold text-gray-900">{fix.name}</h1>
            {fix.resolved && (
              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                Resolved
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {fix.jiraTicket && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {fix.jiraTicket}
              </span>
            )}
            {fix.owner && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                @{fix.owner}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
              {enrichedAnnotations.length} {enrichedAnnotations.length === 1 ? 'issue' : 'issues'}
            </span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
                {criticalCount} critical
              </span>
            )}
            {majorCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                {majorCount} major
              </span>
            )}
          </div>
        </div>

        {/* Issues Grid */}
        {enrichedAnnotations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            No issues linked to this fix yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {enrichedAnnotations.map(annotation => {
              if (!annotation) return null;
              const sev = severityConfig[annotation.severity as Severity];

              return (
                <Link
                  key={annotation.id}
                  href={annotation.link}
                  className="bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all overflow-hidden group"
                >
                  <div className="flex">
                    {/* Screenshot */}
                    <div className="relative w-48 h-32 flex-shrink-0 bg-gray-100 border-r border-gray-200">
                      <Image
                        src={annotation.artifactPath}
                        alt={`Screenshot for ${annotation.runId} V${annotation.promptNumber}`}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-gray-900 font-medium line-clamp-2">{annotation.note}</p>
                        <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FormatIcon format={annotation.format} size={14} />
                          <span className="capitalize">{annotation.format}</span>
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium ${
                          annotation.testType === 'greenfield'
                            ? 'bg-emerald-100 text-emerald-700'
                            : annotation.testType === 'brownfield'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {getTestCategoryShort(annotation.testType)}
                        </span>
                        <span
                          className="cursor-default"
                          title={formatFullDate(annotation.createdAt)}
                        >
                          {getRelativeDate(annotation.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
