'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Annotation, Severity, AnnotationTarget } from '@/lib/annotations';
import { getArtifactUrl } from '@/lib/artifact-url';
import AnnotationPopover from './AnnotationPopover';

interface AnnotatableImageProps {
  artifactPath: string;
  promptNumber: number;
  runId: string;
  annotations: Annotation[];
  onAnnotationCreate: (target: AnnotationTarget, note: string, severity: Severity, issueId: string | null) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  onImageClick: () => void;
}

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

export default function AnnotatableImage({
  artifactPath,
  annotations,
  onAnnotationCreate,
  onAnnotationDelete,
  onImageClick
}: AnnotatableImageProps) {
  const [showAnnotationPopover, setShowAnnotationPopover] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    // If popover is open, close it
    if (showAnnotationPopover) {
      setShowAnnotationPopover(false);
      return;
    }
    // Otherwise open lightbox
    onImageClick();
  };

  const handleAnnotateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAnnotationPopover(true);
  };

  const handleAnnotate = (note: string, severity: Severity, issueId: string | null) => {
    onAnnotationCreate({ type: 'image' }, note, severity, issueId);
    setShowAnnotationPopover(false);
  };

  return (
    <div className="relative">
      {/* Image container */}
      <div
        className="relative inline-block cursor-pointer group"
        onClick={handleImageClick}
      >
        <div className="relative rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors max-w-sm">
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-2 py-1 rounded text-xs transition-opacity">
              Click to expand
            </span>
          </div>

          {/* Image */}
          <Image
            src={getArtifactUrl(artifactPath)}
            alt={`Artifact`}
            width={320}
            height={200}
            className="w-full h-auto max-h-48 object-contain bg-gray-50"
            unoptimized
          />
        </div>

        {/* Add annotation button (appears on hover) */}
        <button
          onClick={handleAnnotateClick}
          className="absolute -right-8 top-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Add annotation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Annotation popover */}
      {showAnnotationPopover && (
        <div className="absolute top-0 left-full ml-2 z-50">
          <AnnotationPopover
            onSave={handleAnnotate}
            onCancel={() => setShowAnnotationPopover(false)}
          />
        </div>
      )}

      {/* Annotations list */}
      {annotations.length > 0 && (
        <div className="mt-2 space-y-1 max-w-sm">
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
              {onAnnotationDelete && (
                <button
                  onClick={() => onAnnotationDelete(annotation.id)}
                  className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete annotation"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
