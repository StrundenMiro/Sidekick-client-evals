'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EnrichedIssue, UseCase } from './page';
import FormatIcon from '@/components/FormatIcon';

type Severity = 'high' | 'medium' | 'low' | 'good';
type Tab = 'issues' | 'usecases';

const severityConfig: Record<Severity, { label: string; color: string; bg: string; order: number }> = {
  high: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100', order: 0 },
  medium: { label: 'Major', color: 'text-orange-700', bg: 'bg-orange-100', order: 1 },
  low: { label: 'Minor', color: 'text-blue-700', bg: 'bg-blue-100', order: 2 },
  good: { label: 'Good', color: 'text-green-700', bg: 'bg-green-100', order: 3 }
};

const issueTypeLabels: Record<string, string> = {
  'context-lost': 'Context Lost',
  'style-drift': 'Style Drift',
  'text-broken': 'Text Broken',
  'data-deleted': 'Data Deleted',
  'wrong-output': 'Wrong Output',
  'new-artifact-instead-of-edit': 'New Artifact Instead of Edit',
  'template-instead-of-edit': 'Template Instead of Edit',
  'invisible-feature': 'Invisible Feature',
  'other': 'Other'
};

const ratingConfig: Record<string, { label: string; color: string; bg: string }> = {
  great: { label: 'Great', color: 'text-green-700', bg: 'bg-green-100' },
  good: { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-100' },
  bad: { label: 'Bad', color: 'text-red-700', bg: 'bg-red-100' }
};

interface Props {
  format: string;
  issues: EnrichedIssue[];
  useCases: UseCase[];
}

export default function FormatClient({ format, issues, useCases }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('issues');
  const [severityFilter, setSeverityFilter] = useState<Severity[]>(['high', 'medium', 'low', 'good']);
  const [useCaseFilter, setUseCaseFilter] = useState<string[]>(['greenfield', 'brownfield']);

  const filteredIssues = useMemo(() => {
    return issues
      .filter(issue =>
        severityFilter.includes(issue.severity) &&
        useCaseFilter.includes(issue.useCase)
      )
      .sort((a, b) => {
        // Sort by severity first
        if (severityConfig[a.severity].order !== severityConfig[b.severity].order) {
          return severityConfig[a.severity].order - severityConfig[b.severity].order;
        }
        // Then by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [issues, severityFilter, useCaseFilter]);

  const toggleSeverity = (severity: Severity) => {
    if (severityFilter.includes(severity)) {
      setSeverityFilter(severityFilter.filter(s => s !== severity));
    } else {
      setSeverityFilter([...severityFilter, severity]);
    }
  };

  const toggleUseCase = (useCase: string) => {
    if (useCaseFilter.includes(useCase)) {
      setUseCaseFilter(useCaseFilter.filter(u => u !== useCase));
    } else {
      setUseCaseFilter([...useCaseFilter, useCase]);
    }
  };

  // Count issues by severity
  const criticalCount = issues.filter(i => i.severity === 'high').length;
  const majorCount = issues.filter(i => i.severity === 'medium').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <FormatIcon format={format} size={32} />
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{format}</h1>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
              {criticalCount} critical
            </span>
          )}
          {majorCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
              {majorCount} major
            </span>
          )}
          <span className="text-sm text-gray-500">
            {useCases.length} use-case{useCases.length !== 1 ? 's' : ''} · {useCases.reduce((sum, uc) => sum + uc.runs.length, 0)} runs
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('issues')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'issues'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Issues ({issues.length})
          </button>
          <button
            onClick={() => setActiveTab('usecases')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'usecases'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Use-cases ({useCases.length})
          </button>
        </nav>
      </div>

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Severity:</span>
              {(Object.keys(severityConfig) as Severity[]).map(severity => (
                <button
                  key={severity}
                  onClick={() => toggleSeverity(severity)}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    severityFilter.includes(severity)
                      ? `${severityConfig[severity].bg} ${severityConfig[severity].color} border-current`
                      : 'bg-gray-100 text-gray-400 border-transparent'
                  }`}
                >
                  {severityConfig[severity].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Use-case:</span>
              {['greenfield', 'brownfield'].map(uc => (
                <button
                  key={uc}
                  onClick={() => toggleUseCase(uc)}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    useCaseFilter.includes(uc)
                      ? uc === 'greenfield'
                        ? 'bg-emerald-100 text-emerald-700 border-current'
                        : 'bg-amber-100 text-amber-700 border-current'
                      : 'bg-gray-100 text-gray-400 border-transparent'
                  }`}
                >
                  {uc === 'greenfield' ? 'Greenfield' : 'Brownfield'}
                </button>
              ))}
            </div>
          </div>

          {/* Issues Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Use-case
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Screenshot
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIssues.map(issue => (
                    <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severityConfig[issue.severity].bg} ${severityConfig[issue.severity].color}`}>
                          {severityConfig[issue.severity].label}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                        {issueTypeLabels[issue.issueType] || issue.issueType}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-md">
                        <div className="flex items-start gap-2">
                          <span
                            className="flex-shrink-0 text-sm"
                            title={issue.author === 'frank' ? 'Found by Frank' : 'Found by human'}
                          >
                            {issue.author === 'frank' ? '🤖' : '👤'}
                          </span>
                          <Link
                            href={issue.link}
                            className="hover:text-blue-600 hover:underline line-clamp-2 whitespace-pre-wrap"
                            title={issue.note}
                          >
                            {issue.note}
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          issue.useCase === 'greenfield'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {issue.useCase === 'greenfield' ? 'GF' : 'BF'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Link href={issue.link} className="block">
                          <div className="relative w-16 h-12 rounded overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                            <Image
                              src={issue.artifactPath}
                              alt={`Screenshot for ${issue.runId} V${issue.promptNumber}`}
                              fill
                              className="object-cover object-top"
                              unoptimized
                            />
                          </div>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredIssues.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No issues match the current filters
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 text-xs text-gray-500 flex gap-4 flex-wrap">
            <span>🤖 = Frank</span>
            <span>👤 = Human</span>
            <span><strong>GF</strong> = Greenfield</span>
            <span><strong>BF</strong> = Brownfield</span>
          </div>
        </div>
      )}

      {/* Use-cases Tab */}
      {activeTab === 'usecases' && (
        <div className="space-y-6">
          {useCases.map(useCase => (
            <div key={useCase.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    useCase.id === 'greenfield'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {useCase.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {useCase.runs.length} run{useCase.runs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {useCase.id === 'greenfield'
                    ? 'Generate new content from scratch'
                    : 'Iterate on existing content'
                  }
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {useCase.runs.map(run => (
                  <li key={run.id}>
                    <Link
                      href={run.link}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm text-gray-700">{run.id}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {new Date(run.timestamp).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">
                              {run.promptCount} prompt{run.promptCount !== 1 ? 's' : ''}
                            </span>
                            {run.rating && ratingConfig[run.rating] && (
                              <>
                                <span className="text-xs text-gray-400">·</span>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ratingConfig[run.rating].bg} ${ratingConfig[run.rating].color}`}>
                                  {ratingConfig[run.rating].label}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-gray-600">
                          View →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {useCases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No runs found for this format
            </div>
          )}
        </div>
      )}
    </div>
  );
}
