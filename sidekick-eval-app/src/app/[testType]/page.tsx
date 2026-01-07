import { Suspense } from 'react';
import { getFormatsByTestType, getRunRating } from '@/lib/runs';
import { getTestType } from '@/lib/test-types';
import { getPromptsForTestType } from '@/lib/test-prompts';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import TestTypeTabs from './TestTypeTabs';

const FORMAT_ORDER = ['table', 'stickies', 'document', 'prototype', 'flowchart', 'slides', 'image', 'mindmap', 'erd', 'sequence', 'class'];

export default async function TestTypePage({ params }: { params: Promise<{ testType: string }> }) {
  const { testType } = await params;
  const testTypeInfo = getTestType(testType);

  if (!testTypeInfo) {
    notFound();
  }

  const formats = getFormatsByTestType(testType);
  const testPrompts = getPromptsForTestType(testType);
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

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{testTypeInfo.name}</h1>
          <p className="text-gray-500 mt-1">{testTypeInfo.description}</p>
        </header>

        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
          <TestTypeTabs
            testType={testType}
            formatList={formatList}
            testPrompts={testPrompts}
            evaluationFocus={testTypeInfo.evaluationFocus}
          />
        </Suspense>
      </div>
    </main>
  );
}
