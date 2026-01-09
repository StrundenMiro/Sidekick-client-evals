'use client';

import { useState } from 'react';
import Link from 'next/link';
import FormatIcon from './FormatIcon';
import { getRelativeDate, formatFullDate } from '@/lib/dateUtils';

interface Run {
  id: string;
  format: string;
  timestamp: string;
  issueCount: number;
  testType: string;
}

interface RecentRunsProps {
  runs: Run[];
}

function getRunDisplayName(run: Run): string {
  const useCase = run.testType === 'existing-content-iteration' ? 'Brownfield' : 'Greenfield';
  const date = new Date(run.timestamp);
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${useCase} · ${time}`;
}

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
                <span className="text-sm text-gray-700">{getRunDisplayName(run)}</span>
              </div>
              <div className="flex items-center gap-3">
                {run.issueCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500 group-hover:bg-red-100 group-hover:text-red-700 transition-colors">
                    {run.issueCount} issue{run.issueCount !== 1 ? 's' : ''}
                  </span>
                )}
                <span
                  className="text-xs text-gray-400 cursor-default"
                  title={formatFullDate(run.timestamp)}
                >
                  {getRelativeDate(run.timestamp)}
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
