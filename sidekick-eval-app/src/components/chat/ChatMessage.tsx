'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Annotation, Severity } from '@/lib/annotations';
import AnnotationPopover from './AnnotationPopover';

interface ChatMessageProps {
  type: 'user' | 'ai';
  messageId: number;
  title?: string;
  children: React.ReactNode;
  onCopyLink?: () => void;
  annotations?: Annotation[];
  onAnnotate?: (note: string, severity: Severity, issueId: string | null) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  noContainer?: boolean;
}

export default function ChatMessage({
  type,
  messageId,
  title,
  children,
  onCopyLink,
  annotations = [],
  onAnnotate,
  onDeleteAnnotation,
  noContainer = false
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showAnnotationPopover, setShowAnnotationPopover] = useState(false);

  const handleCopy = () => {
    onCopyLink?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnnotate = (note: string, severity: Severity, issueId: string | null) => {
    onAnnotate?.(note, severity, issueId);
    setShowAnnotationPopover(false);
  };

  const handleMessageClick = () => {
    if (onAnnotate && !showAnnotationPopover) {
      setShowAnnotationPopover(true);
    }
  };

  const isUser = type === 'user';

  // Get severity color for annotation indicator
  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-blue-500';
      case 'good': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex gap-3">
      {/* Avatar - always on left */}
      {isUser ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 border border-gray-200">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      ) : (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 border border-purple-200">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2" />
            <circle cx="12" cy="14" r="2" />
          </svg>
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header with name */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {isUser ? (title || 'User') : 'Sidekick'}
          </span>
          {onCopyLink && (
            <button
              onClick={handleCopy}
              className="text-gray-300 hover:text-gray-500 text-xs transition-colors"
              title="Copy link"
            >
              {copied ? '✓' : '#'}
            </button>
          )}
        </div>

        {/* Message content - with or without container */}
        {noContainer ? (
          // No container - just render children directly (for artifact-only messages)
          <div>{children}</div>
        ) : (
          // With container - no bg by default, subtle hover
          <div className="relative">
            <div
              onClick={handleMessageClick}
              className={`rounded-lg p-2 -ml-2 transition-colors ${
                onAnnotate ? 'cursor-pointer' : ''
              } ${
                isUser
                  ? 'hover:bg-gray-100'
                  : 'hover:bg-purple-50'
              }`}
            >
              {children}
            </div>

            {/* Annotations list */}
            {annotations.length > 0 && (
              <div className="mt-2 space-y-1">
                {annotations.map(annotation => (
                  <div
                    key={annotation.id}
                    className={`flex items-start gap-2 text-sm p-2 rounded-md ${
                      annotation.severity === 'high' ? 'bg-red-50 border-l-2 border-red-400' :
                      annotation.severity === 'medium' ? 'bg-orange-50 border-l-2 border-orange-400' :
                      annotation.severity === 'low' ? 'bg-blue-50 border-l-2 border-blue-400' :
                      'bg-green-50 border-l-2 border-green-400'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${getSeverityColor(annotation.severity)}`} />
                    <span className={`flex-1 ${
                      annotation.severity === 'high' ? 'text-red-800' :
                      annotation.severity === 'medium' ? 'text-orange-800' :
                      annotation.severity === 'low' ? 'text-blue-800' :
                      'text-green-800'
                    }`}>
                      {annotation.note}
                    </span>
                    <button
                      onClick={() => onDeleteAnnotation?.(annotation.id)}
                      className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete annotation"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Annotation popover */}
            {showAnnotationPopover && (
              <div className="absolute top-0 left-full ml-2 z-50">
                <AnnotationPopover
                  onSave={handleAnnotate}
                  onCancel={() => setShowAnnotationPopover(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
