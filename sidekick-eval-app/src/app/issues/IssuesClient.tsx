'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FormatIcon from '@/components/FormatIcon';
import { PlannedFix } from '@/lib/plannedFixes';
import { getRelativeDate, formatFullDate } from '@/lib/dateUtils';
import { TestCategory, getTestCategoryShort } from '@/lib/test-types';

type Severity = 'high' | 'medium' | 'low' | 'good';
type Tab = 'open' | 'resolved';

export interface EnrichedIssue {
  id: string;
  runId: string;
  promptNumber: number;
  note: string;
  severity: Severity;
  issueType: string;
  author: 'frank' | 'human';
  testType: TestCategory;
  format: string;
  artifactPath: string;
  link: string;
  createdAt: string;
  plannedFixId: string | null;
  owner: string | null;
}

interface IssuesClientProps {
  issues: EnrichedIssue[];
  totalRuns: number;
  plannedFixes: PlannedFix[];
}

const severityConfig: Record<Severity, { label: string; color: string; bg: string; bar: string; order: number }> = {
  high: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100', bar: 'bg-red-500', order: 0 },
  medium: { label: 'Major', color: 'text-orange-700', bg: 'bg-orange-100', bar: 'bg-orange-400', order: 1 },
  low: { label: 'Minor', color: 'text-blue-700', bg: 'bg-blue-100', bar: 'bg-blue-400', order: 2 },
  good: { label: 'Good', color: 'text-green-700', bg: 'bg-green-100', bar: 'bg-green-400', order: 3 }
};

// Modal for creating/editing an issue
function IssueModal({
  issue,
  isOpen,
  onClose,
  onSave,
  onDelete
}: {
  issue: PlannedFix | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | null, name: string, jiraTicket: string, owner: string, resolved: boolean) => Promise<PlannedFix | void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(issue?.name || '');
  const [jiraTicket, setJiraTicket] = useState(issue?.jiraTicket || '');
  const [owner, setOwner] = useState(issue?.owner || '');
  const [resolved, setResolved] = useState(issue?.resolved || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (issue) {
      setName(issue.name);
      setJiraTicket(issue.jiraTicket || '');
      setOwner(issue.owner || '');
      setResolved(issue.resolved || false);
    } else {
      setName('');
      setJiraTicket('');
      setOwner('');
      setResolved(false);
    }
  }, [issue, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onSave(issue?.id || null, name.trim(), jiraTicket.trim(), owner.trim(), resolved);
    setIsSubmitting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!issue || !onDelete || !confirm(`Delete "${issue.name}"? All occurrences will become untriaged.`)) return;
    setIsSubmitting(true);
    await onDelete(issue.id);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {issue ? 'Edit Issue' : 'Create Issue'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {issue ? 'Update the issue details.' : 'Create a new issue to group related occurrences.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Context lost after iterations"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jira ticket <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={jiraTicket}
              onChange={e => setJiraTicket(e.target.value)}
              placeholder="e.g., SIDEKICK-1234"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              placeholder="e.g., @john"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>
          {issue && (
            <div className="flex items-center gap-3 pt-2 pb-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resolved}
                  onChange={e => setResolved(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Mark as resolved</span>
              </label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            {issue && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : issue ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Occurrence row component
function OccurrenceRow({ occurrence }: { occurrence: EnrichedIssue }) {
  return (
    <Link
      href={occurrence.link}
      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors group"
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-12 rounded overflow-hidden border border-gray-200 group-hover:border-blue-400 transition-colors flex-shrink-0">
        <Image
          src={occurrence.artifactPath}
          alt={`Screenshot for ${occurrence.runId}`}
          fill
          className="object-cover object-top"
          unoptimized
        />
      </div>

      {/* Note */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 truncate">{occurrence.note}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <FormatIcon format={occurrence.format} size={12} />
          <span className="text-xs text-gray-500 capitalize">{occurrence.format}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            occurrence.testType === 'greenfield'
              ? 'bg-emerald-100 text-emerald-700'
              : occurrence.testType === 'brownfield'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-purple-100 text-purple-700'
          }`}>
            {getTestCategoryShort(occurrence.testType)}
          </span>
        </div>
      </div>

      {/* Date */}
      <span
        className="text-xs text-gray-400 flex-shrink-0"
        title={formatFullDate(occurrence.createdAt)}
      >
        {getRelativeDate(occurrence.createdAt)}
      </span>
    </Link>
  );
}

// Issue group component (expandable)
function IssueGroup({
  issue,
  occurrences,
  isExpanded,
  onToggle,
  onEdit
}: {
  issue: PlannedFix;
  occurrences: EnrichedIssue[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  // Calculate highest severity in occurrences
  const highestSeverity = useMemo((): Severity => {
    let highest: Severity = 'low';
    for (const occ of occurrences) {
      if (occ.severity === 'high') return 'high';
      if (occ.severity === 'medium') highest = 'medium';
    }
    return highest;
  }, [occurrences]);

  const sevConfig = severityConfig[highestSeverity];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Issue header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        {/* Expand/collapse icon */}
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Severity indicator */}
        <div className={`w-2.5 h-2.5 rounded-full ${sevConfig.bar}`} title={sevConfig.label} />

        {/* Issue name */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900">{issue.name}</span>
          {issue.jiraTicket && (
            <span className="ml-2 text-xs text-gray-400">{issue.jiraTicket}</span>
          )}
        </div>

        {/* Owner */}
        {issue.owner && (
          <span className="text-xs text-gray-500">@{issue.owner}</span>
        )}

        {/* Occurrence count */}
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          {occurrences.length}
        </span>

        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
          title="Edit issue"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Occurrences list */}
      {isExpanded && occurrences.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
          {occurrences.map(occ => (
            <OccurrenceRow key={occ.id} occurrence={occ} />
          ))}
        </div>
      )}
    </div>
  );
}

// Untriaged occurrences section
function UntriagedSection({
  occurrences,
  isExpanded,
  onToggle,
  issues,
  onAssignIssue,
  onCreateIssue
}: {
  occurrences: EnrichedIssue[];
  isExpanded: boolean;
  onToggle: () => void;
  issues: PlannedFix[];
  onAssignIssue: (occurrenceId: string, issueId: string) => void;
  onCreateIssue: (occurrenceId: string) => void;
}) {
  const [assigningId, setAssigningId] = useState<string | null>(null);

  if (occurrences.length === 0) return null;

  return (
    <div className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50/30">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-amber-50 transition-colors"
        onClick={onToggle}
      >
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />

        <span className="font-medium text-amber-800">Untriaged</span>

        <div className="flex-1" />

        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
          {occurrences.length}
        </span>
      </div>

      {/* Occurrences */}
      {isExpanded && (
        <div className="border-t border-amber-200 bg-white divide-y divide-gray-100">
          {occurrences.map(occ => (
            <div key={occ.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
              {/* Thumbnail */}
              <Link href={occ.link} className="flex-shrink-0">
                <div className="relative w-16 h-12 rounded overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                  <Image
                    src={occ.artifactPath}
                    alt={`Screenshot for ${occ.runId}`}
                    fill
                    className="object-cover object-top"
                    unoptimized
                  />
                </div>
              </Link>

              {/* Note */}
              <Link href={occ.link} className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{occ.note}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <FormatIcon format={occ.format} size={12} />
                  <span className="text-xs text-gray-500 capitalize">{occ.format}</span>
                </div>
              </Link>

              {/* Assign dropdown */}
              <div className="relative">
                <button
                  onClick={() => setAssigningId(assigningId === occ.id ? null : occ.id)}
                  className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  + Tag issue
                </button>

                {assigningId === occ.id && (
                  <div className="absolute z-10 right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    {issues.length > 0 && (
                      <div className="max-h-48 overflow-y-auto">
                        {issues.filter(i => !i.resolved).map(issue => (
                          <button
                            key={issue.id}
                            onClick={() => {
                              onAssignIssue(occ.id, issue.id);
                              setAssigningId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {issue.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          onCreateIssue(occ.id);
                          setAssigningId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        + Create new issue...
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IssuesClient({ issues: allOccurrences, totalRuns, plannedFixes: initialFixes }: IssuesClientProps) {
  const router = useRouter();
  const [localOccurrences, setLocalOccurrences] = useState(allOccurrences);
  const [fixes, setFixes] = useState(initialFixes);
  const [activeTab, setActiveTab] = useState<Tab>('open');
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [untriagedExpanded, setUntriagedExpanded] = useState(true);
  const [editingIssue, setEditingIssue] = useState<PlannedFix | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingOccurrenceId, setPendingOccurrenceId] = useState<string | null>(null);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [router]);

  // Sync props to local state
  useEffect(() => {
    setLocalOccurrences(allOccurrences);
  }, [allOccurrences]);

  useEffect(() => {
    setFixes(initialFixes);
  }, [initialFixes]);

  // Filter out praise (good severity)
  const occurrencesOnly = useMemo(() => {
    return localOccurrences.filter(o => o.severity !== 'good');
  }, [localOccurrences]);

  // Group occurrences by issue
  const groupedByIssue = useMemo(() => {
    const groups = new Map<string, EnrichedIssue[]>();
    const untriaged: EnrichedIssue[] = [];

    occurrencesOnly.forEach(occ => {
      if (occ.plannedFixId) {
        const existing = groups.get(occ.plannedFixId) || [];
        existing.push(occ);
        groups.set(occ.plannedFixId, existing);
      } else {
        untriaged.push(occ);
      }
    });

    return { groups, untriaged };
  }, [occurrencesOnly]);

  // Get issues with their occurrences, filtered by tab
  const displayIssues = useMemo(() => {
    const resolvedSet = new Set(fixes.filter(f => f.resolved).map(f => f.id));

    return fixes
      .filter(f => activeTab === 'resolved' ? f.resolved : !f.resolved)
      .map(f => ({
        issue: f,
        occurrences: (groupedByIssue.groups.get(f.id) || []).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }))
      .filter(g => g.occurrences.length > 0 || activeTab === 'open') // Show empty issues only in open tab
      .sort((a, b) => b.occurrences.length - a.occurrences.length);
  }, [fixes, groupedByIssue, activeTab]);

  // Counts
  const openIssueCount = fixes.filter(f => !f.resolved).length;
  const resolvedIssueCount = fixes.filter(f => f.resolved).length;
  const untriagedCount = groupedByIssue.untriaged.length;

  const toggleIssue = (issueId: string) => {
    setExpandedIssues(prev => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const handleAssignIssue = async (occurrenceId: string, issueId: string) => {
    const occurrence = localOccurrences.find(o => o.id === occurrenceId);
    if (!occurrence) return;

    setLocalOccurrences(prev =>
      prev.map(o => o.id === occurrenceId ? { ...o, plannedFixId: issueId } : o)
    );

    try {
      await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: occurrence.id,
          runId: occurrence.runId,
          promptNumber: occurrence.promptNumber,
          issueType: occurrence.issueType,
          severity: occurrence.severity,
          note: occurrence.note,
          plannedFixId: issueId,
          owner: occurrence.owner
        })
      });
    } catch (error) {
      console.error('Failed to assign issue:', error);
      setLocalOccurrences(prev =>
        prev.map(o => o.id === occurrenceId ? { ...o, plannedFixId: occurrence.plannedFixId } : o)
      );
    }
  };

  const handleSaveIssue = async (
    id: string | null,
    name: string,
    jiraTicket: string,
    owner: string,
    resolved: boolean
  ): Promise<PlannedFix | void> => {
    if (id) {
      // Update existing
      setFixes(prev =>
        prev.map(f => f.id === id ? { ...f, name, jiraTicket: jiraTicket || null, owner: owner || null, resolved } : f)
      );

      try {
        await fetch('/api/planned-fixes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name, jiraTicket: jiraTicket || null, owner: owner || null, resolved })
        });
      } catch (error) {
        console.error('Failed to save issue:', error);
      }
    } else {
      // Create new
      try {
        const response = await fetch('/api/planned-fixes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, jiraTicket: jiraTicket || null, owner: owner || null })
        });
        const { plannedFix } = await response.json();
        setFixes(prev => [...prev, plannedFix]);

        // If we have a pending occurrence, assign it
        if (pendingOccurrenceId) {
          await handleAssignIssue(pendingOccurrenceId, plannedFix.id);
          setPendingOccurrenceId(null);
        }

        return plannedFix;
      } catch (error) {
        console.error('Failed to create issue:', error);
      }
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    setFixes(prev => prev.filter(f => f.id !== issueId));
    setLocalOccurrences(prev =>
      prev.map(o => o.plannedFixId === issueId ? { ...o, plannedFixId: null } : o)
    );

    try {
      await fetch(`/api/planned-fixes?id=${issueId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete issue:', error);
    }
  };

  const openCreateModal = (occurrenceId?: string) => {
    if (occurrenceId) setPendingOccurrenceId(occurrenceId);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      <IssueModal
        issue={editingIssue}
        isOpen={!!editingIssue || isCreateModalOpen}
        onClose={() => {
          setEditingIssue(null);
          setIsCreateModalOpen(false);
          setPendingOccurrenceId(null);
        }}
        onSave={handleSaveIssue}
        onDelete={editingIssue ? handleDeleteIssue : undefined}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
          <p className="text-sm text-gray-500 mt-1">
            {occurrencesOnly.length} occurrences across {totalRuns} runs
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Issue
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('open')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'open'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Open ({openIssueCount})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'resolved'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resolved ({resolvedIssueCount})
          </button>
        </nav>
      </div>

      {/* Untriaged section (only in open tab) */}
      {activeTab === 'open' && (
        <UntriagedSection
          occurrences={groupedByIssue.untriaged}
          isExpanded={untriagedExpanded}
          onToggle={() => setUntriagedExpanded(!untriagedExpanded)}
          issues={fixes}
          onAssignIssue={handleAssignIssue}
          onCreateIssue={openCreateModal}
        />
      )}

      {/* Issues list */}
      <div className="space-y-3">
        {displayIssues.map(({ issue, occurrences }) => (
          <IssueGroup
            key={issue.id}
            issue={issue}
            occurrences={occurrences}
            isExpanded={expandedIssues.has(issue.id)}
            onToggle={() => toggleIssue(issue.id)}
            onEdit={() => setEditingIssue(issue)}
          />
        ))}

        {displayIssues.length === 0 && activeTab === 'resolved' && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
            No resolved issues yet
          </div>
        )}

        {displayIssues.length === 0 && activeTab === 'open' && untriagedCount === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
            No issues found. Create one to start grouping occurrences.
          </div>
        )}
      </div>
    </div>
  );
}
