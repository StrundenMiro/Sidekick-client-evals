import { getRunByIdAsync, getRunsByTestTypeAndFormatAsync } from '@/lib/runs';
import { getTestType } from '@/lib/test-types';
import { getAnnotationsForRunAsync, type Annotation } from '@/lib/annotations';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import RunDetail from './RunDetail';

export default async function RunPage({ params }: { params: Promise<{ testType: string; format: string; runId: string }> }) {
  const { testType, format, runId } = await params;
  const testTypeInfo = getTestType(testType);
  const run = await getRunByIdAsync(runId);

  if (!testTypeInfo || !run) {
    notFound();
  }

  // Get annotations for this run
  const annotations = await getAnnotationsForRunAsync(runId);
  const annotationsByPrompt: Record<number, Annotation> = {};
  annotations.forEach(a => {
    annotationsByPrompt[a.promptNumber] = a;
  });

  // Get all runs for this format to enable prev/next navigation
  // Reverse so oldest is #1 and newest is last (chronological order)
  const allRuns = (await getRunsByTestTypeAndFormatAsync(testType, format)).reverse();
  const currentIndex = allRuns.findIndex(r => r.id === runId);
  const prevRun = currentIndex > 0 ? allRuns[currentIndex - 1] : null;
  const nextRun = currentIndex < allRuns.length - 1 ? allRuns[currentIndex + 1] : null;

  const nav = {
    prevRunId: prevRun?.id ?? null,
    nextRunId: nextRun?.id ?? null,
    currentIndex,
    totalRuns: allRuns.length
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/' },
            { label: testTypeInfo.shortName, href: `/${testType}` },
            { label: format.replace('_', ' '), href: `/${testType}/${format}` },
            { label: runId }
          ]} />
        </div>

        <RunDetail
          run={run}
          testType={testType}
          format={format}
          nav={nav}
          annotationsByPrompt={annotationsByPrompt}
        />
      </div>
    </main>
  );
}
