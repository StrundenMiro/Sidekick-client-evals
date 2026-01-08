'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Type definitions (duplicated to avoid importing server-side code)
type Severity = 'high' | 'medium' | 'low' | 'good';
type IssueType = 'context-lost' | 'style-drift' | 'text-broken' | 'data-deleted' | 'wrong-output' | 'other' | 'new-artifact-instead-of-edit' | 'template-instead-of-edit' | 'invisible-feature';

export interface EnrichedIssue {
  id: string;
  runId: string;
  promptNumber: number;
  note: string;
  severity: Severity;
  issueType: string;
  author: 'frank' | 'human';
  testType: 'greenfield' | 'brownfield';
  format: string;
  artifactPath: string;
  link: string;
  createdAt: string;
}

type SortField = 'severity' | 'issueType' | 'format' | 'testType' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface IssuesClientProps {
  issues: EnrichedIssue[];
  totalRuns: number;
}

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

export default function IssuesClient({ issues, totalRuns }: IssuesClientProps) {
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [severityFilter, setSeverityFilter] = useState<Severity[]>(['high', 'medium', 'low', 'good']);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSeverityFilter = (severity: Severity) => {
    if (severityFilter.includes(severity)) {
      setSeverityFilter(severityFilter.filter(s => s !== severity));
    } else {
      setSeverityFilter([...severityFilter, severity]);
    }
  };

  const sortedAndFilteredIssues = useMemo(() => {
    let filtered = issues.filter(issue => severityFilter.includes(issue.severity));

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'severity':
          comparison = severityConfig[a.severity].order - severityConfig[b.severity].order;
          break;
        case 'issueType':
          comparison = a.issueType.localeCompare(b.issueType);
          break;
        case 'format':
          comparison = a.format.localeCompare(b.format);
          break;
        case 'testType':
          comparison = a.testType.localeCompare(b.testType);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [issues, sortField, sortDirection, severityFilter]);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-gray-400">
            {sortDirection === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Issues</h1>
          <p className="text-sm text-gray-500 mt-1">
            Found {sortedAndFilteredIssues.length} issues across {totalRuns} runs
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter:</span>
          {(Object.keys(severityConfig) as Severity[]).map(severity => (
            <button
              key={severity}
              onClick={() => toggleSeverityFilter(severity)}
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader field="severity" label="Severity" />
                <SortHeader field="issueType" label="Type" />
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <SortHeader field="format" label="Format" />
                <SortHeader field="testType" label="Test" />
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Screenshot
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredIssues.map(issue => (
                <tr
                  key={issue.id}
                  className="hover:bg-gray-50 transition-colors"
                >
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
                        className="hover:text-blue-600 hover:underline line-clamp-2"
                        title={issue.note}
                      >
                        {issue.note}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 capitalize">
                    {issue.format}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      issue.testType === 'greenfield'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {issue.testType === 'greenfield' ? 'GF' : 'BF'}
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

        {sortedAndFilteredIssues.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No issues match the current filter
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-500 flex gap-4 flex-wrap">
        <span>🤖 = Frank</span>
        <span>👤 = Human</span>
        <span><strong>GF</strong> = Greenfield</span>
        <span><strong>BF</strong> = Brownfield</span>
      </div>
    </div>
  );
}
