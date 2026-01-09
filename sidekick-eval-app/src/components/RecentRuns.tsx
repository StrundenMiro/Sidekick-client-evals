'use client';

import { useState } from 'react';
import Link from 'next/link';
import FormatIcon from './FormatIcon';

interface Run {
  id: string;
  format: string;
  timestamp: string;
  rating?: string;
  testType: string;
}

interface RecentRunsProps {
  runs: Run[];
}

const ratingConfig: Record<string, { label: string; color: string; bg: string }> = {
  great: { label: 'Great', color: 'text-green-700', bg: 'bg-green-100' },
  good: { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-100' },
  bad: { label: 'Bad', color: 'text-red-700', bg: 'bg-red-100' }
};

export default function RecentRuns({ runs }: RecentRunsProps) {
  const [expanded, setExpanded] = useState(false);

  const displayedRuns = expanded ? runs : runs.slice(0, 3);
  const hasMore = runs.length > 3;

  return (
    <section className="mb-8">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Recent Runs
      </h2>
      <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {displayedRuns.map(run => (
          <li key={run.id}>
            <Link
              href={`/${run.testType}/${run.format}/${run.id}`}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <FormatIcon format={run.format} size={18} />
                <span className="font-mono text-sm text-gray-700">{run.id}</span>
              </div>
              <div className="flex items-center gap-3">
                {run.rating && ratingConfig[run.rating] && (
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${ratingConfig[run.rating].bg} ${ratingConfig[run.rating].color}`}>
                    {ratingConfig[run.rating].label}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(run.timestamp).toLocaleDateString()}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          {expanded ? 'Show less' : `Show all ${runs.length} runs`}
        </button>
      )}
    </section>
  );
}
