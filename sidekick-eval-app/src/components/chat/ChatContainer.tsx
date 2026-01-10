'use client';

import { useState, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import AnnotatableImage from './AnnotatableImage';
import type { Run, Message, getRunMessages } from '@/lib/runs';
import type { Annotation, Severity, AnnotationTarget } from '@/lib/annotations';
import { getArtifactUrl } from '@/lib/artifact-url';

interface ChatContainerProps {
  run: Run;
  testType: string;
  format: string;
  annotationsByMessage: Record<number, Annotation[]>;
  onLightboxOpen: (index: number) => void;
}

// Get messages from run (uses messages array or converts legacy prompts)
function getMessages(run: Run): Message[] {
  // If run has messages array, use it
  if (run.messages && run.messages.length > 0) {
    return run.messages;
  }

  // Convert legacy prompts to messages
  const messages: Message[] = [];
  let messageId = 1;

  run.prompts.forEach(prompt => {
    // User message (the prompt text)
    messages.push({
      id: messageId++,
      role: 'user',
      text: prompt.text
    });

    // Agent response (if available)
    const response = 'response' in prompt ? prompt.response : undefined;
    if (response || prompt.artifact) {
      messages.push({
        id: messageId++,
        role: 'agent',
        text: response || '',
        artifact: prompt.artifact || undefined
      });
    }
  });

  return messages;
}

export default function ChatContainer({
  run,
  testType,
  format,
  annotationsByMessage,
  onLightboxOpen
}: ChatContainerProps) {
  const [localAnnotations, setLocalAnnotations] = useState<Record<number, Annotation[]>>(annotationsByMessage);
  const [localRun, setLocalRun] = useState(run);

  // Get messages from the run
  const messages = getMessages(localRun);

  // Collect all artifact images for lightbox indexing
  const allImages = messages
    .filter(m => m.artifact)
    .map(m => getArtifactUrl(m.artifact!));

  const copyShareLink = async (anchor: string) => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Create annotation via API
  const handleAnnotationCreate = useCallback(async (
    messageId: number,
    target: AnnotationTarget,
    note: string,
    severity: Severity,
    issueId: string | null
  ) => {
    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: localRun.id,
          messageId,
          promptNumber: messageId, // Legacy compatibility
          author: 'human',
          issueType: 'other',
          severity,
          note,
          plannedFixId: issueId,
          target: target.type === 'image' ? {
            type: 'image',
            x: target.marker.x,
            y: target.marker.y,
            label: target.marker.label
          } : { type: 'message' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state with new annotation
        setLocalAnnotations(prev => ({
          ...prev,
          [messageId]: [...(prev[messageId] || []), data.annotation]
        }));
      }
    } catch (error) {
      console.error('Failed to create annotation:', error);
    }
  }, [localRun.id]);

  // Delete annotation via API
  const handleAnnotationDelete = useCallback(async (annotationId: string, messageId: number) => {
    try {
      const res = await fetch(`/api/annotations?id=${annotationId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Remove from local state
        setLocalAnnotations(prev => ({
          ...prev,
          [messageId]: (prev[messageId] || []).filter(a => a.id !== annotationId)
        }));
      }
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  }, []);

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const annotations = localAnnotations[message.id] || [];
        const imageIndex = message.artifact ? allImages.indexOf(getArtifactUrl(message.artifact)) : -1;

        // Separate annotations by target type
        const imageAnnotations = annotations.filter(a => a.target?.type === 'image');
        const messageAnnotations = annotations.filter(a => !a.target || a.target.type !== 'image');

        const hasTextContent = !!message.text;
        const hasArtifact = !!message.artifact;
        const artifactOnly = hasArtifact && !hasTextContent;

        return (
          <div
            key={message.id}
            id={`m${message.id}`}
            className="scroll-mt-6"
          >
            <ChatMessage
              type={message.role === 'user' ? 'user' : 'ai'}
              messageId={message.id}
              onCopyLink={() => copyShareLink(`m${message.id}`)}
              annotations={messageAnnotations}
              onAnnotate={hasTextContent ? (note, severity, issueId) =>
                handleAnnotationCreate(message.id, { type: 'message' }, note, severity, issueId)
              : undefined}
              onDeleteAnnotation={(annotationId) => handleAnnotationDelete(annotationId, message.id)}
              noContainer={artifactOnly}
            >
              {/* Message text */}
              {message.text && (
                <p className={`whitespace-pre-wrap ${message.role === 'user' ? 'text-gray-800' : 'text-gray-700'}`}>
                  {message.text}
                </p>
              )}

              {/* Context preview (for context messages) */}
              {message.role === 'context' && message.contextPreview && (
                <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                  <img
                    src={getArtifactUrl(message.contextPreview)}
                    alt="Context"
                    className="max-h-20 rounded"
                  />
                </div>
              )}

              {/* Artifact image (annotatable) */}
              {message.artifact && (
                <div className={hasTextContent ? 'mt-3' : ''}>
                  <AnnotatableImage
                    artifactPath={message.artifact}
                    promptNumber={message.id}
                    runId={localRun.id}
                    annotations={imageAnnotations}
                    onAnnotationCreate={(target, note, severity, issueId) =>
                      handleAnnotationCreate(message.id, target, note, severity, issueId)
                    }
                    onAnnotationDelete={(annotationId) => handleAnnotationDelete(annotationId, message.id)}
                    onImageClick={() => imageIndex >= 0 && onLightboxOpen(imageIndex)}
                  />
                </div>
              )}

              {/* No content */}
              {!message.text && !message.artifact && message.role === 'agent' && (
                <p className="text-gray-400 italic">No response captured</p>
              )}
            </ChatMessage>
          </div>
        );
      })}
    </div>
  );
}
