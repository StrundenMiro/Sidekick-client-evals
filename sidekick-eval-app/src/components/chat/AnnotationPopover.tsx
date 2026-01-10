'use client';

import { useState, useEffect, useRef } from 'react';
import type { Severity } from '@/lib/annotations';

interface PlannedFix {
  id: string;
  name: string;
  jiraTicket?: string;
  resolved?: boolean;
}

interface AnnotationPopoverProps {
  position?: { x: number; y: number };  // Optional: for positioned popovers
  onSave: (note: string, severity: Severity, issueId: string | null) => void;
  onCancel: () => void;
}

const severityOptions: { value: Severity; label: string; color: string; bgColor: string }[] = [
  { value: 'high', label: 'Critical', color: 'bg-red-500', bgColor: 'bg-red-100' },
  { value: 'medium', label: 'Major', color: 'bg-orange-500', bgColor: 'bg-orange-100' },
  { value: 'low', label: 'Minor', color: 'bg-blue-500', bgColor: 'bg-blue-100' },
  { value: 'good', label: 'Good', color: 'bg-green-500', bgColor: 'bg-green-100' },
];

export default function AnnotationPopover({
  position,
  onSave,
  onCancel
}: AnnotationPopoverProps) {
  const [note, setNote] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [issues, setIssues] = useState<PlannedFix[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showIssueSelector, setShowIssueSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Fetch issues on mount
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await fetch('/api/planned-fixes');
        if (res.ok) {
          const data = await res.json();
          setIssues(data.plannedFixes || []);
        }
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIssues();
  }, []);

  // Focus note input on mount
  useEffect(() => {
    noteRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = () => {
    if (!note.trim()) return;
    onSave(note.trim(), severity, selectedIssueId);
  };

  const selectedIssue = issues.find(i => i.id === selectedIssueId);
  const unresolvedIssues = issues.filter(i => !i.resolved);

  // Styles based on whether position is provided
  const positionStyle = position
    ? {
        position: 'fixed' as const,
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.min(position.y, window.innerHeight - 300)
      }
    : {};

  return (
    <div
      ref={popoverRef}
      className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-72"
      style={positionStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">
          Add annotation
        </span>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Issue tag selector */}
      <div className="mb-2">
        {selectedIssue ? (
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200">
            <span className="text-purple-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </span>
            <span className="text-sm text-purple-700 flex-1 truncate">{selectedIssue.name}</span>
            <button
              onClick={() => setSelectedIssueId(null)}
              className="text-purple-400 hover:text-purple-600"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIssueSelector(!showIssueSelector)}
            className="w-full text-left p-2 border border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors"
          >
            + Tag with issue
          </button>
        )}

        {/* Issue dropdown */}
        {showIssueSelector && !selectedIssue && (
          <div className="mt-1 max-h-40 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-md">
            {isLoading ? (
              <div className="p-3 text-sm text-gray-500">Loading...</div>
            ) : unresolvedIssues.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No issues defined</div>
            ) : (
              unresolvedIssues.map(issue => (
                <button
                  key={issue.id}
                  onClick={() => {
                    setSelectedIssueId(issue.id);
                    setShowIssueSelector(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-red-500 flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-gray-900">{issue.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Note input */}
      <textarea
        ref={noteRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What did you notice?"
        className="w-full p-2 border border-gray-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-300"
        rows={2}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.metaKey) {
            handleSubmit();
          }
        }}
      />

      {/* Severity selector */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-500">Severity:</span>
        <div className="flex gap-1">
          {severityOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSeverity(opt.value)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                severity === opt.value
                  ? `${opt.color} border-gray-800 scale-110`
                  : `${opt.bgColor} border-transparent hover:scale-105`
              }`}
              title={opt.label}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!note.trim()}
          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}
