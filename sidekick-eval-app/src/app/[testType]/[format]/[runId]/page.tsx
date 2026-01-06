import { getRunById } from '@/lib/runs';
import { getTestType } from '@/lib/test-types';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import RunDetail from './RunDetail';

export default async function RunPage({ params }: { params: Promise<{ testType: string; format: string; runId: string }> }) {
  const { testType, format, runId } = await params;
  const testTypeInfo = getTestType(testType);
  const run = getRunById(runId);

  if (!testTypeInfo || !run) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <Breadcrumbs items={[
          { label: 'Frank', href: '/' },
          { label: testTypeInfo.shortName, href: `/${testType}` },
          { label: format.replace('_', ' '), href: `/${testType}/${format}` },
          { label: runId }
        ]} />

        <RunDetail run={run} testType={testType} format={format} />
      </div>
    </main>
  );
}
