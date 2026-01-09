'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FormatIcon from '@/components/FormatIcon';
import { PlannedFix } from '@/lib/plannedFixes';
import { getRelativeDate, formatFullDate } from '@/lib/dateUtils';
import { TestCategory, getTestCategoryShort } from '@/lib/test-types';

type Severity = 'high' | 'medium' | 'low' | 'good';
type Tab = 'open' | 'fixed' | 'praise';

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

// Modal for creating a new planned fix
function CreateFixModal({
  isOpen,
  onClose,
  onCreate
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, jiraTicket: string, owner: string) => Promise<PlannedFix>;
}) {
  const [name, setName] = useState('');
  const [jiraTicket, setJiraTicket] = useState('');
  const [owner, setOwner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onCreate(name.trim(), jiraTicket.trim(), owner.trim());
    setName('');
    setJiraTicket('');
    setOwner('');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Create Planned Fix</h2>
        <p className="text-sm text-gray-500 mb-4">
          Group related issues by the fix that will resolve them.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fix name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Sliding window context"
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
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Fix'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal for editing a planned fix
function EditFixModal({
  fix,
  onClose,
  onSave,
  onDelete
}: {
  fix: PlannedFix | null;
  onClose: () => void;
  onSave: (id: string, name: string, jiraTicket: string, owner: string, resolved: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(fix?.name || '');
  const [jiraTicket, setJiraTicket] = useState(fix?.jiraTicket || '');
  const [owner, setOwner] = useState(fix?.owner || '');
  const [resolved, setResolved] = useState(fix?.resolved || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (fix) {
      setName(fix.name);
      setJiraTicket(fix.jiraTicket || '');
      setOwner(fix.owner || '');
      setResolved(fix.resolved || false);
    }
  }, [fix]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fix) return;
    setIsSubmitting(true);
    await onSave(fix.id, name.trim(), jiraTicket.trim(), owner.trim(), resolved);
    setIsSubmitting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!fix || !confirm(`Delete "${fix.name}"?`)) return;
    setIsSubmitting(true);
    await onDelete(fix.id);
    setIsSubmitting(false);
    onClose();
  };

  if (!fix) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Planned Fix</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fix name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
            {resolved && (
              <span className="text-xs text-green-600">Issues will be hidden</span>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Delete
            </button>
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
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Severity dots picker
function SeverityDots({
  severity,
  onChange
}: {
  severity: Severity;
  onChange: (sev: Severity) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredSev, setHoveredSev] = useState<Severity | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayLabel = hoveredSev ? severityConfig[hoveredSev].label : severityConfig[severity].label;

  return (
    <div ref={containerRef} className="relative">
      {isOpen ? (
        <div className="absolute top-0 left-0 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <div className="flex items-center gap-1.5">
            {(Object.keys(severityConfig) as Severity[]).map(sev => (
              <button
                key={sev}
                onClick={() => {
                  onChange(sev);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHoveredSev(sev)}
                onMouseLeave={() => setHoveredSev(null)}
                className={`w-3 h-3 rounded-full transition-all ${severityConfig[sev].bar} ${
                  severity === sev
                    ? 'ring-2 ring-offset-1 ring-gray-400'
                    : 'opacity-50 hover:opacity-100 hover:scale-125'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-600 mt-1.5 text-center min-w-[60px]">
            {displayLabel}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-3 h-3 rounded-full ${severityConfig[severity].bar} opacity-40 group-hover/row:opacity-100 hover:scale-125 transition-all`}
          title={`${severityConfig[severity].label} - click to change`}
        />
      )}
    </div>
  );
}

// Fix dropdown
function FixDropdown({
  issue,
  fixes,
  onAssign,
  onOpenCreateModal,
  onEditFix
}: {
  issue: EnrichedIssue;
  fixes: PlannedFix[];
  onAssign: (issueId: string, fixId: string | null) => void;
  onOpenCreateModal: () => void;
  onEditFix: (fix: PlannedFix) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFix = fixes.find(f => f.id === issue.plannedFixId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-xs px-2 py-1 rounded border transition-colors ${
          currentFix
            ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
        }`}
      >
        {currentFix ? currentFix.name : '+ Fix'}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 right-0">
          {currentFix && (
            <button
              onClick={() => {
                onAssign(issue.id, null);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              None
            </button>
          )}
          {fixes.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {fixes.map(fix => (
                <div
                  key={fix.id}
                  className={`group flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${
                    fix.id === issue.plannedFixId ? 'bg-purple-50' : ''
                  }`}
                >
                  <button
                    onClick={() => {
                      onAssign(issue.id, fix.id);
                      setIsOpen(false);
                    }}
                    className={`flex-1 text-left ${
                      fix.id === issue.plannedFixId ? 'text-purple-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{fix.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {fix.jiraTicket && <span>{fix.jiraTicket}</span>}
                      {fix.owner && <span>@{fix.owner}</span>}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onEditFix(fix);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100"
                    title="Edit fix"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {fixes.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No fixes yet</div>
          )}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCreateModal();
              }}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              + Create new fix...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IssuesClient({ issues, totalRuns, plannedFixes: initialFixes }: IssuesClientProps) {
  const router = useRouter();
  const [localIssues, setLocalIssues] = useState(issues);
  const [fixes, setFixes] = useState(initialFixes);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingIssueId, setPendingIssueId] = useState<string | null>(null);
  const [editingFix, setEditingFix] = useState<PlannedFix | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('open');

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
    setLocalIssues(issues);
  }, [issues]);

  useEffect(() => {
    setFixes(initialFixes);
  }, [initialFixes]);

  // Get resolved fix IDs for filtering
  const resolvedFixIds = useMemo(() => {
    return new Set(fixes.filter(f => f.resolved).map(f => f.id));
  }, [fixes]);

  // Separate issues from praise (good severity)
  const issuesOnly = useMemo(() => {
    return localIssues.filter(i => i.severity !== 'good');
  }, [localIssues]);

  const praiseOnly = useMemo(() => {
    return localIssues.filter(i => i.severity === 'good');
  }, [localIssues]);

  // Count fixed issues (excluding praise)
  const fixedIssueCount = useMemo(() => {
    return issuesOnly.filter(i => i.plannedFixId && resolvedFixIds.has(i.plannedFixId)).length;
  }, [issuesOnly, resolvedFixIds]);

  // Count open issues (excluding praise and fixed)
  const openIssueCount = useMemo(() => {
    return issuesOnly.filter(i => !i.plannedFixId || !resolvedFixIds.has(i.plannedFixId)).length;
  }, [issuesOnly, resolvedFixIds]);

  const sortedIssues = useMemo(() => {
    let filtered: typeof localIssues = [];

    if (activeTab === 'praise') {
      filtered = praiseOnly;
    } else if (activeTab === 'fixed') {
      filtered = issuesOnly.filter(i => i.plannedFixId && resolvedFixIds.has(i.plannedFixId));
    } else if (activeTab === 'open') {
      filtered = issuesOnly.filter(i => !i.plannedFixId || !resolvedFixIds.has(i.plannedFixId));
    }

    return filtered.sort((a, b) => {
      if (severityConfig[a.severity].order !== severityConfig[b.severity].order) {
        return severityConfig[a.severity].order - severityConfig[b.severity].order;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [localIssues, activeTab, resolvedFixIds, issuesOnly, praiseOnly]);

  const handleAssignFix = async (issueId: string, fixId: string | null) => {
    const issue = localIssues.find(i => i.id === issueId);
    if (!issue) return;

    setLocalIssues(prev =>
      prev.map(i => i.id === issueId ? { ...i, plannedFixId: fixId } : i)
    );

    try {
      await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: issue.id,
          runId: issue.runId,
          promptNumber: issue.promptNumber,
          issueType: issue.issueType,
          severity: issue.severity,
          note: issue.note,
          plannedFixId: fixId,
          owner: issue.owner
        })
      });
    } catch (error) {
      console.error('Failed to assign fix:', error);
      setLocalIssues(prev =>
        prev.map(i => i.id === issueId ? { ...i, plannedFixId: issue.plannedFixId } : i)
      );
    }
  };

  const handleChangeSeverity = async (issueId: string, newSeverity: Severity) => {
    const issue = localIssues.find(i => i.id === issueId);
    if (!issue || issue.severity === newSeverity) return;

    const oldSeverity = issue.severity;

    setLocalIssues(prev =>
      prev.map(i => i.id === issueId ? { ...i, severity: newSeverity } : i)
    );

    try {
      await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: issue.id,
          runId: issue.runId,
          promptNumber: issue.promptNumber,
          issueType: issue.issueType,
          severity: newSeverity,
          note: issue.note,
          plannedFixId: issue.plannedFixId,
          owner: issue.owner
        })
      });
    } catch (error) {
      console.error('Failed to change severity:', error);
      setLocalIssues(prev =>
        prev.map(i => i.id === issueId ? { ...i, severity: oldSeverity } : i)
      );
    }
  };

  const handleCreateFix = async (name: string, jiraTicket: string, owner: string): Promise<PlannedFix> => {
    const response = await fetch('/api/planned-fixes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, jiraTicket: jiraTicket || null, owner: owner || null })
    });
    const { plannedFix } = await response.json();
    setFixes(prev => [...prev, plannedFix]);

    if (pendingIssueId) {
      handleAssignFix(pendingIssueId, plannedFix.id);
      setPendingIssueId(null);
    }

    return plannedFix;
  };

  const handleDeleteFix = async (fixId: string) => {
    setFixes(prev => prev.filter(f => f.id !== fixId));
    setLocalIssues(prev =>
      prev.map(i => i.plannedFixId === fixId ? { ...i, plannedFixId: null } : i)
    );

    try {
      await fetch(`/api/planned-fixes?id=${fixId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete fix:', error);
    }
  };

  const handleSaveFix = async (id: string, name: string, jiraTicket: string, owner: string, resolved: boolean) => {
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
      console.error('Failed to save fix:', error);
    }
  };

  const openCreateModal = (issueId?: string) => {
    if (issueId) setPendingIssueId(issueId);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setPendingIssueId(null);
  };

  return (
    <div className="space-y-4">
      {/* Modals */}
      <CreateFixModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCreate={handleCreateFix}
      />
      <EditFixModal
        fix={editingFix}
        onClose={() => setEditingFix(null)}
        onSave={handleSaveFix}
        onDelete={handleDeleteFix}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Issues</h1>
        <p className="text-sm text-gray-500 mt-1">
          Found {localIssues.length} issues across {totalRuns} runs
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('open')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'open'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Open Issues ({openIssueCount})
          </button>
          <button
            onClick={() => setActiveTab('fixed')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'fixed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Fixed Issues ({fixedIssueCount})
          </button>
          <button
            onClick={() => setActiveTab('praise')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'praise'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Praise ({praiseOnly.length})
          </button>
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14">Format</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Found</th>
                {activeTab !== 'praise' && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Fix</th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedIssues.map(issue => (
                <tr key={issue.id} className="hover:bg-gray-50 transition-colors group/row">
                  <td className="px-3 py-2">
                    <SeverityDots
                      severity={issue.severity}
                      onChange={(sev) => handleChangeSeverity(issue.id, sev)}
                    />
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    <span className="line-clamp-2" title={issue.note.length > 80 ? issue.note : undefined}>
                      {issue.note}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/format/${issue.format}`}
                      className="inline-block hover:scale-110 transition-transform"
                      title={issue.format.charAt(0).toUpperCase() + issue.format.slice(1)}
                    >
                      <FormatIcon format={issue.format} size={18} />
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      issue.testType === 'greenfield'
                        ? 'bg-emerald-100 text-emerald-700'
                        : issue.testType === 'brownfield'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {getTestCategoryShort(issue.testType)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className="text-xs text-gray-500 cursor-default"
                      title={formatFullDate(issue.createdAt)}
                    >
                      {getRelativeDate(issue.createdAt)}
                    </span>
                  </td>
                  {activeTab !== 'praise' && (
                    <td className="px-3 py-2">
                      <FixDropdown
                        issue={issue}
                        fixes={fixes}
                        onAssign={handleAssignFix}
                        onOpenCreateModal={() => openCreateModal(issue.id)}
                        onEditFix={setEditingFix}
                      />
                    </td>
                  )}
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

        {sortedIssues.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {activeTab === 'fixed' ? 'No fixed issues yet' : activeTab === 'praise' ? 'No praise items yet' : 'No open issues'}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-500 flex gap-4">
        <span><strong>GF</strong> = Greenfield</span>
        <span><strong>BF</strong> = Brownfield</span>
      </div>
    </div>
  );
}
