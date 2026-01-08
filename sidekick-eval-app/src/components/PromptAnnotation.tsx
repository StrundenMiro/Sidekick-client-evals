'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const ISSUE_TYPES = [
  { id: 'context-lost', label: 'Context Lost', emoji: '🔄' },
  { id: 'style-drift', label: 'Style Drift', emoji: '🎨' },
  { id: 'text-broken', label: 'Text Broken', emoji: '📝' },
  { id: 'data-deleted', label: 'Data Deleted', emoji: '🗑️' },
  { id: 'wrong-output', label: 'Wrong Output', emoji: '❌' },
  { id: 'other', label: 'Other', emoji: '📌' }
] as const;

type IssueType = typeof ISSUE_TYPES[number]['id'];
type Severity = 'high' | 'medium' | 'low';

interface Annotation {
  id: string;
  runId: string;
  promptNumber: number;
  issueType: IssueType;
  severity: Severity;
  note: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  runId: string;
  promptNumber: number;
  initialAnnotation?: Annotation | null;
  minimal?: boolean;
}

export default function PromptAnnotation({ runId, promptNumber, initialAnnotation, minimal }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<IssueType[]>(
    initialAnnotation?.issueType ? [initialAnnotation.issueType] : []
  );
  const [severity, setSeverity] = useState<Severity>(initialAnnotation?.severity || 'high');
  const [note, setNote] = useState(initialAnnotation?.note || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(initialAnnotation?.updatedAt || null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasAnnotation = selectedTypes.length > 0 || note.trim().length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-save when selection changes
  const saveAnnotation = useCallback(async () => {
    if (selectedTypes.length === 0 && !note.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          promptNumber,
          issueType: selectedTypes[0] || 'other', // Use 'other' if just a note
          severity,
          note: `${selectedTypes.length > 1 ? `[${selectedTypes.join(', ')}] ` : ''}${note}`.trim()
        })
      });

      if (response.ok) {
        const { annotation } = await response.json();
        setLastSaved(annotation.updatedAt);
      }
    } catch (error) {
      console.error('Failed to save annotation:', error);
    } finally {
      setIsSaving(false);
    }
  }, [runId, promptNumber, selectedTypes, severity, note]);

  // Save on changes
  useEffect(() => {
    if (selectedTypes.length > 0) {
      const timer = setTimeout(saveAnnotation, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedTypes, severity, saveAnnotation]);

  const handleDelete = async () => {
    try {
      await fetch(`/api/annotations?runId=${runId}&promptNumber=${promptNumber}`, {
        method: 'DELETE'
      });
      setSelectedTypes([]);
      setSeverity('medium');
      setNote('');
      setLastSaved(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  };

  const toggleType = (typeId: IssueType) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Minimal mode - inline editing */}
      {minimal ? (
        <div className="flex gap-3 items-start flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
            hasAnnotation || isOpen
              ? 'bg-slate-200 text-slate-500'
              : 'bg-gray-100 text-gray-300'
          }`}>
            👤
          </div>
          <div className="flex-1">
            {isOpen ? (
              <div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  onBlur={() => {
                    saveAnnotation();
                    if (!note.trim()) setIsOpen(false);
                  }}
                  placeholder="Add your thoughts..."
                  className={`w-full text-gray-700 border-none focus:outline-none rounded px-1.5 py-0.5 -mx-1 ${
                    severity === 'high' ? 'bg-red-100' :
                    severity === 'medium' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1">
                    {(['high', 'medium', 'low'] as const).map((s, index) => (
                      <button
                        key={s}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setSeverity(s)}
                        className={`w-3 h-3 rounded-full ${
                          s === 'high' ? 'bg-red-500' :
                          s === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        } ${severity === s ? 'ring-2 ring-offset-1 ring-gray-400' : 'hover:opacity-70'}`}
                        style={{
                          opacity: severity === s ? 1 : 0.4,
                          animation: `spreadDot 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05}s both`,
                          ['--spread-distance' as string]: `${-index * 16}px`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {isSaving ? 'Saving...' : lastSaved ? '✓ Saved' : ''}
                  </span>
                </div>
              </div>
            ) : note.trim() ? (
              <button
                onClick={() => setIsOpen(true)}
                className="text-left w-full group"
              >
                <p className="text-xs text-gray-400 mb-1 group-hover:text-gray-500">Human take</p>
                <p className="text-gray-700 group-hover:text-gray-900">
                  <span className={`rounded px-1.5 py-0.5 ${
                    severity === 'high' ? 'bg-red-100' :
                    severity === 'medium' ? 'bg-orange-100' :
                    severity === 'low' ? 'bg-blue-100' : ''
                  }`}>
                    {note}
                  </span>
                </p>
              </button>
            ) : (
              <button
                onClick={() => setIsOpen(true)}
                className="text-left italic text-gray-300 hover:text-gray-500"
              >
                Add your take...
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
              hasAnnotation
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {hasAnnotation ? '📝 Edit' : '+ Note'}
            <span className="text-[10px]">▼</span>
          </button>

          {/* Dropdown for non-minimal mode */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={saveAnnotation}
                placeholder="Add your thoughts..."
                className={`w-full text-sm p-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none transition-colors ${
                  severity === 'high' ? 'bg-red-50' :
                  severity === 'medium' ? 'bg-orange-50' :
                  severity === 'low' ? 'bg-blue-50' : ''
                }`}
                rows={3}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1">
                  {(['high', 'medium', 'low'] as const).map(s => (
                    <button
                      key={s}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setSeverity(s)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        s === 'high' ? 'bg-red-500' :
                        s === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      } ${severity === s ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-40 hover:opacity-70'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  {isSaving ? 'Saving...' : lastSaved ? '✓ Saved' : ''}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
