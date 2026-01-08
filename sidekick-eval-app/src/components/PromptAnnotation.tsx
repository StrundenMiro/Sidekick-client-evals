'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type Severity = 'high' | 'medium' | 'low' | 'good';
type Author = 'frank' | 'human';

interface Annotation {
  id: string;
  runId: string;
  promptNumber: number;
  author: Author;
  issueType: string;
  severity: Severity;
  note: string;
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
  onEdit,
  onDelete
}: {
  annotation: Annotation;
  onEdit: () => void;
  onDelete: () => void;
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
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">{isFrank ? "Frank's take" : 'Human take'}</p>
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
        <p className="text-gray-700">
          <span className={`rounded px-1.5 py-0.5 whitespace-pre-wrap ${getSeverityColor(annotation.severity)}`}>
            {annotation.note}
          </span>
        </p>
      </div>
    </div>
  );
}

// Annotation editor (inline)
function AnnotationEditor({
  initialNote = '',
  initialSeverity = 'medium' as Severity,
  onSave,
  onCancel,
  autoFocus = true
}: {
  initialNote?: string;
  initialSeverity?: Severity;
  onSave: (note: string, severity: Severity) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}) {
  const [note, setNote] = useState(initialNote);
  const [severity, setSeverity] = useState<Severity>(initialSeverity);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredSeverity, setHoveredSeverity] = useState<Severity | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [note]);

  const handleSave = async () => {
    if (!note.trim()) {
      onCancel();
      return;
    }
    setIsSaving(true);
    await onSave(note, severity);
    setIsSaving(false);
  };

  return (
    <div className="flex gap-3 items-start">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-slate-200 text-slate-500">
        👤
      </div>
      <div className="flex-1">
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
          placeholder="Add your thoughts..."
          rows={1}
          className={`w-full text-gray-700 border-none focus:outline-none rounded px-1.5 py-0.5 resize-none overflow-hidden ${getSeverityColor(severity)}`}
          autoFocus={autoFocus}
        />
        <div className="flex items-center gap-2 mt-2">
          <div className="flex gap-1.5 items-center">
            {(['good', 'low', 'medium', 'high'] as const).map((s) => (
              <button
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSeverity(s)}
                onMouseEnter={() => setHoveredSeverity(s)}
                onMouseLeave={() => setHoveredSeverity(null)}
                className={`w-3 h-3 rounded-full ${getSeverityColor(s, 'dot')} ${
                  severity === s ? 'ring-2 ring-offset-1 ring-gray-400' : 'hover:opacity-70'
                }`}
                style={{ opacity: severity === s ? 1 : 0.4 }}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1 capitalize">
              {isSaving ? 'Saving...' : (hoveredSeverity || severity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromptAnnotation({ runId, promptNumber, initialAnnotations = [], minimal }: Props) {
  // Sort: Frank's annotations first, then human's
  const sortedInitial = [...initialAnnotations].sort((a, b) => {
    if (a.author === 'frank' && b.author !== 'frank') return -1;
    if (a.author !== 'frank' && b.author === 'frank') return 1;
    return 0;
  });
  const [annotations, setAnnotations] = useState<Annotation[]>(sortedInitial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const saveAnnotation = useCallback(async (note: string, severity: Severity, existingId?: string, existingAuthor?: Author) => {
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
          note
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

  if (!minimal) {
    // Non-minimal mode (not used much, keeping simple)
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
            onSave={(note, severity) => saveAnnotation(note, severity, annotation.id, annotation.author)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <AnnotationItem
            key={annotation.id}
            annotation={annotation}
            onEdit={() => setEditingId(annotation.id)}
            onDelete={() => deleteAnnotation(annotation.id)}
          />
        )
      ))}

      {/* Add new annotation */}
      {isAdding ? (
        <AnnotationEditor
          onSave={(note, severity) => saveAnnotation(note, severity)}
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
          <span className="text-gray-300 group-hover/add:text-gray-500 italic transition-colors">
            {annotations.length > 0 ? 'Add another...' : 'Add your take...'}
          </span>
        </div>
      )}
    </div>
  );
}
