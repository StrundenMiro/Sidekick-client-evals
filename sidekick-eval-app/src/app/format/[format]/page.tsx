import Link from 'next/link';
import { getRunsAsync, getRunTestType, Run } from '@/lib/runs';
import { getAnnotationsAsync, Annotation, SEVERITY_CONFIG } from '@/lib/annotations';
import { getPlannedFixesAsync, PlannedFix } from '@/lib/plannedFixes';
import FormatClient from './FormatClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ format: string }>;
}

export interface EnrichedIssue {
  id: string;
  runId: string;
  promptNumber: number;
  note: string;
  severity: 'high' | 'medium' | 'low' | 'good';
  issueType: string;
  author: 'frank' | 'human';
  useCase: 'greenfield' | 'brownfield';
  artifactPath: string;
  link: string;
  createdAt: string;
  plannedFixId: string | null;
  owner: string | null;
}

export interface UseCase {
  id: string;
  name: string;
  runs: {
    id: string;
    timestamp: string;
    rating: string | null;
    promptCount: number;
    link: string;
  }[];
}

export default async function FormatPage({ params }: Props) {
  const { format } = await params;

  const [runs, annotations, plannedFixes] = await Promise.all([
    getRunsAsync(),
    getAnnotationsAsync(),
    getPlannedFixesAsync()
  ]);

  // Filter runs for this format
  const formatRuns = runs.filter(r => r.format === format);

  // Build enriched issues for this format
  const enrichedIssues: EnrichedIssue[] = annotations
    .filter(annotation => {
      const run = formatRuns.find(r => r.id === annotation.runId);
      return run !== undefined;
    })
    .map(annotation => {
      const run = formatRuns.find(r => r.id === annotation.runId)!;
      const testType = getRunTestType(run);
      const useCase: 'greenfield' | 'brownfield' =
        testType === 'existing-content-iteration' ? 'brownfield' : 'greenfield';

      return {
        id: annotation.id,
        runId: annotation.runId,
        promptNumber: annotation.promptNumber,
        note: annotation.note,
        severity: annotation.severity,
        issueType: annotation.issueType,
        author: annotation.author,
        useCase,
        artifactPath: `/artifacts/${annotation.runId}/v${annotation.promptNumber}.png`,
        link: `/${testType}/${format}/${annotation.runId}#v${annotation.promptNumber}`,
        createdAt: annotation.createdAt,
        plannedFixId: annotation.plannedFixId,
        owner: annotation.owner
      };
    });

  // Build use-cases with runs
  const useCaseMap = new Map<string, UseCase>();

  formatRuns.forEach(run => {
    const testType = getRunTestType(run);
    const useCaseId = testType === 'existing-content-iteration' ? 'brownfield' : 'greenfield';
    const useCaseName = useCaseId === 'brownfield' ? 'Brownfield' : 'Greenfield';

    if (!useCaseMap.has(useCaseId)) {
      useCaseMap.set(useCaseId, {
        id: useCaseId,
        name: useCaseName,
        runs: []
      });
    }

    const rating = 'rating' in run ? run.rating : null;

    useCaseMap.get(useCaseId)!.runs.push({
      id: run.id,
      timestamp: run.timestamp,
      rating,
      promptCount: run.prompts.length,
      link: `/${testType}/${format}/${run.id}`
    });
  });

  // Sort runs within use-cases by timestamp (newest first)
  const useCases = Array.from(useCaseMap.values()).map(uc => ({
    ...uc,
    runs: uc.runs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <span>←</span> Back to Formats
          </Link>
        </nav>

        <FormatClient
          format={format}
          issues={enrichedIssues}
          useCases={useCases}
          plannedFixes={plannedFixes}
        />
      </div>
    </div>
  );
}
