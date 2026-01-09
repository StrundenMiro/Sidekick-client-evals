'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type Severity = 'high' | 'medium' | 'low' | 'good';
type Author = 'frank' | 'human';

interface PlannedFix {
  id: string;
  name: string;
  jiraTicket: string | null;
  owner: string | null;
  resolved: boolean;
}

interface Annotation {
  id: string;
  runId: string;
  promptNumber: number;
  author: Author;
  issueType: string;
  severity: Severity;
  note: string;
  plannedFixId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  runId: string;
  promptNumber: number;
  initialAnnotations?: Annotation[];
  minimal?: boolean;
}

function getSeverityColor(severity: Severity, type: 'bg' | 'dot' = 'bg') {
  if (type === 'dot') {
    return severity === 'good' ? 'bg-green-500' :
           severity === 'high' ? 'bg-red-500' :
           severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500';
  }
  return severity === 'good' ? 'bg-green-100' :
         severity === 'high' ? 'bg-red-100' :
         severity === 'medium' ? 'bg-orange-100' : 'bg-blue-100';
}

// Single annotation item (display mode)
function AnnotationItem({
  annotation,
  issue,
  onEdit,
  onDelete,
  onChangeIssue
}: {
  annotation: Annotation;
  issue: PlannedFix | null;
  onEdit: () => void;
  onDelete: () => void;
  onChangeIssue: () => void;
}) {
  const isFrank = annotation.author === 'frank';

  return (
    <div className="flex gap-3 items-start group">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
        isFrank ? 'bg-gradient-to-br from-blue-400 to-purple-500' : 'bg-slate-200 text-slate-500'
      }`}>
        {isFrank ? '🤖' : '👤'}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {/* Issue tag */}
          <button
            onClick={onChangeIssue}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              issue
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {issue ? `⚠ ${issue.name}` : '+ Tag issue'}
          </button>
          <button
            onClick={onEdit}
            className="text-xs text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
        <p className="text-gray-700 text-sm">
          <span className={`rounded px-1.5 py-0.5 whitespace-pre-wrap ${getSeverityColor(annotation.severity)}`}>
            {annotation.note}
          </span>
        </p>
      </div>
    </div>
  );
}

// Issue selector dropdown
function IssueSelector({
  issues,
  selectedIssueId,
  onSelect,
  onCreateNew,
  onClose
}: {
  issues: PlannedFix[];
  selectedIssueId: string | null;
  onSelect: (issueId: string | null) => void;
  onCreateNew: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const unresolvedIssues = issues.filter(i => !i.resolved);

  return (
    <div ref={ref} className="absolute z-20 left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
      {selectedIssueId && (
        <button
          onClick={() => onSelect(null)}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
        >
          Remove tag
        </button>
      )}
      {unresolvedIssues.length > 0 && (
        <div className="max-h-48 overflow-y-auto">
          {unresolvedIssues.map(issue => (
            <button
              key={issue.id}
              onClick={() => onSelect(issue.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                issue.id === selectedIssueId ? 'bg-red-50 text-red-700' : 'text-gray-700'
              }`}
            >
              <div className="font-medium">{issue.name}</div>
              {issue.jiraTicket && (
                <div className="text-xs text-gray-400">{issue.jiraTicket}</div>
              )}
            </button>
          ))}
        </div>
      )}
      {unresolvedIssues.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-400">No issues yet</div>
      )}
      <div className="border-t border-gray-100 mt-1 pt-1">
        <button
          onClick={onCreateNew}
          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
        >
          + Create new issue...
        </button>
      </div>
    </div>
  );
}

// Create issue modal
function CreateIssueModal({
  isOpen,
  onClose,
  onCreate
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Create Issue</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Context lost after iterations"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 mb-3"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Annotation editor (inline)
function AnnotationEditor({
  initialNote = '',
  initialSeverity = 'medium' as Severity,
  initialIssueId = null as string | null,
  issues,
  onSave,
  onCancel,
  autoFocus = true
}: {
  initialNote?: string;
  initialSeverity?: Severity;
  initialIssueId?: string | null;
  issues: PlannedFix[];
  onSave: (note: string, severity: Severity, issueId: string | null) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}) {
  const [note, setNote] = useState(initialNote);
  const [severity, setSeverity] = useState<Severity>(initialSeverity);
  const [issueId, setIssueId] = useState<string | null>(initialIssueId);
  const [showIssueSelector, setShowIssueSelector] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localIssues, setLocalIssues] = useState(issues);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSavedRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [note]);

  const handleSave = async () => {
    if (hasSavedRef.current || isSaving) return;
    if (!note.trim()) {
      onCancel();
      return;
    }
    hasSavedRef.current = true;
    setIsSaving(true);
    await onSave(note, severity, issueId);
    setIsSaving(false);
  };

  const handleCreateIssue = async (name: string) => {
    try {
      const response = await fetch('/api/planned-fixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const { plannedFix } = await response.json();
      setLocalIssues(prev => [...prev, plannedFix]);
      setIssueId(plannedFix.id);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create issue:', error);
    }
  };

  const selectedIssue = localIssues.find(i => i.id === issueId);

  return (
    <div className="flex gap-3 items-start">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-slate-200 text-slate-500">
        👤
      </div>
      <div className="flex-1">
        {/* Issue tag - primary action */}
        <div className="relative mb-2">
          <button
            onClick={() => setShowIssueSelector(!showIssueSelector)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              selectedIssue
                ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {selectedIssue ? `⚠ ${selectedIssue.name}` : '+ Tag with issue'}
          </button>
          {showIssueSelector && (
            <IssueSelector
              issues={localIssues}
              selectedIssueId={issueId}
              onSelect={(id) => {
                setIssueId(id);
                setShowIssueSelector(false);
              }}
              onCreateNew={() => {
                setShowIssueSelector(false);
                setShowCreateModal(true);
              }}
              onClose={() => setShowIssueSelector(false)}
            />
          )}
        </div>

        {/* Note - context for this occurrence */}
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
            if (e.key === 'Escape') onCancel();
          }}
          onBlur={handleSave}
          placeholder="Describe what's wrong here..."
          rows={1}
          className={`w-full text-gray-700 border-none focus:outline-none rounded px-1.5 py-0.5 resize-none overflow-hidden text-sm ${getSeverityColor(severity)}`}
          autoFocus={autoFocus}
        />

        {/* Severity dots */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex gap-1.5 items-center">
            {(['low', 'medium', 'high'] as const).map((s) => (
              <button
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSeverity(s)}
                className={`w-3 h-3 rounded-full transition-all ${getSeverityColor(s, 'dot')} ${
                  severity === s ? 'ring-2 ring-offset-1 ring-gray-400' : 'hover:opacity-70'
                }`}
                style={{ opacity: severity === s ? 1 : 0.4 }}
                title={s === 'low' ? 'Minor' : s === 'medium' ? 'Major' : 'Critical'}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {isSaving ? 'Saving...' : 'Enter to save'}
          </span>
        </div>

        <CreateIssueModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateIssue}
        />
      </div>
    </div>
  );
}

export default function PromptAnnotation({ runId, promptNumber, initialAnnotations = [], minimal }: Props) {
  const sortedInitial = [...initialAnnotations].sort((a, b) => {
    if (a.author === 'frank' && b.author !== 'frank') return -1;
    if (a.author !== 'frank' && b.author === 'frank') return 1;
    return 0;
  });
  const [annotations, setAnnotations] = useState<Annotation[]>(sortedInitial);
  const [issues, setIssues] = useState<PlannedFix[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [changingIssueId, setChangingIssueId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch issues on mount
  useEffect(() => {
    async function fetchIssues() {
      try {
        const response = await fetch('/api/planned-fixes');
        const data = await response.json();
        setIssues(data.plannedFixes || []);
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      }
    }
    fetchIssues();
  }, []);

  const saveAnnotation = useCallback(async (
    note: string,
    severity: Severity,
    issueId: string | null,
    existingId?: string,
    existingAuthor?: Author
  ) => {
    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingId,
          runId,
          promptNumber,
          author: existingAuthor || 'human',
          issueType: 'other',
          severity,
          note,
          plannedFixId: issueId
        })
      });

      if (response.ok) {
        const { annotation } = await response.json();
        if (existingId) {
          setAnnotations(prev => prev.map(a => a.id === existingId ? annotation : a));
        } else {
          setAnnotations(prev => [...prev, annotation]);
        }
        setEditingId(null);
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to save annotation:', error);
    }
  }, [runId, promptNumber]);

  const updateAnnotationIssue = useCallback(async (annotationId: string, issueId: string | null) => {
    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation) return;

    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: annotation.id,
          runId: annotation.runId,
          promptNumber: annotation.promptNumber,
          author: annotation.author,
          issueType: annotation.issueType,
          severity: annotation.severity,
          note: annotation.note,
          plannedFixId: issueId
        })
      });

      if (response.ok) {
        const { annotation: updated } = await response.json();
        setAnnotations(prev => prev.map(a => a.id === annotationId ? updated : a));
      }
    } catch (error) {
      console.error('Failed to update annotation:', error);
    }
    setChangingIssueId(null);
  }, [annotations]);

  const deleteAnnotation = useCallback(async (annotationId: string) => {
    try {
      const response = await fetch(`/api/annotations?id=${annotationId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      }
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  }, []);

  const handleCreateIssue = async (name: string) => {
    try {
      const response = await fetch('/api/planned-fixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const { plannedFix } = await response.json();
      setIssues(prev => [...prev, plannedFix]);
      // If we were changing an annotation's issue, assign the new one
      if (changingIssueId) {
        await updateAnnotationIssue(changingIssueId, plannedFix.id);
      }
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create issue:', error);
    }
  };

  if (!minimal) {
    return (
      <div className="text-sm text-gray-500">
        {annotations.length} annotation(s)
      </div>
    );
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Existing annotations */}
      {annotations.map(annotation => (
        editingId === annotation.id ? (
          <AnnotationEditor
            key={annotation.id}
            initialNote={annotation.note}
            initialSeverity={annotation.severity}
            initialIssueId={annotation.plannedFixId}
            issues={issues}
            onSave={(note, severity, issueId) => saveAnnotation(note, severity, issueId, annotation.id, annotation.author)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={annotation.id} className="relative">
            <AnnotationItem
              annotation={annotation}
              issue={issues.find(i => i.id === annotation.plannedFixId) || null}
              onEdit={() => setEditingId(annotation.id)}
              onDelete={() => deleteAnnotation(annotation.id)}
              onChangeIssue={() => setChangingIssueId(changingIssueId === annotation.id ? null : annotation.id)}
            />
            {changingIssueId === annotation.id && (
              <div className="ml-9 mt-1">
                <IssueSelector
                  issues={issues}
                  selectedIssueId={annotation.plannedFixId}
                  onSelect={(issueId) => updateAnnotationIssue(annotation.id, issueId)}
                  onCreateNew={() => {
                    setShowCreateModal(true);
                  }}
                  onClose={() => setChangingIssueId(null)}
                />
              </div>
            )}
          </div>
        )
      ))}

      {/* Add new annotation */}
      {isAdding ? (
        <AnnotationEditor
          issues={issues}
          onSave={(note, severity, issueId) => saveAnnotation(note, severity, issueId)}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <div
          className="flex gap-3 items-start cursor-pointer group/add"
          onClick={() => setIsAdding(true)}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-gray-100 text-gray-300 group-hover/add:bg-slate-200 group-hover/add:text-slate-500 transition-colors">
            👤
          </div>
          <span className="text-gray-300 group-hover/add:text-gray-500 italic transition-colors text-sm">
            {annotations.length > 0 ? 'Add another...' : 'Tag an issue...'}
          </span>
        </div>
      )}

      <CreateIssueModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setChangingIssueId(null);
        }}
        onCreate={handleCreateIssue}
      />
    </div>
  );
}
