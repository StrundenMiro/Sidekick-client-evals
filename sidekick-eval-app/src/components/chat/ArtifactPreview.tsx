'use client';

import Image from 'next/image';
import type { Annotation } from '@/lib/annotations';
import { getArtifactUrl } from '@/lib/artifact-url';

interface ArtifactPreviewProps {
  artifactPath: string;
  promptNumber: number;
  annotations?: Annotation[];
  onClick: () => void;
}

export default function ArtifactPreview({
  artifactPath,
  promptNumber,
  annotations = [],
  onClick
}: ArtifactPreviewProps) {
  // Filter for image annotations only
  const imageAnnotations = annotations.filter(
    a => a.target?.type === 'image'
  );

  return (
    <div
      className="relative cursor-pointer group rounded-lg overflow-hidden border border-gray-200"
      onClick={onClick}
    >
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-3 py-1 rounded text-sm transition-opacity">
          Click to zoom
        </span>
      </div>

      {/* Image */}
      <Image
        src={getArtifactUrl(artifactPath)}
        alt={`V${promptNumber} artifact`}
        width={600}
        height={400}
        className="w-full h-auto"
        unoptimized
      />

      {/* Image markers (annotation pins) */}
      {imageAnnotations.map((annotation, index) => {
        if (annotation.target?.type !== 'image') return null;
        const { x, y, label } = annotation.target.marker;
        const displayLabel = label || String(index + 1);

        return (
          <div
            key={annotation.id}
            className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white z-20 cursor-pointer
              ${annotation.severity === 'high' ? 'bg-red-500 text-white' :
                annotation.severity === 'medium' ? 'bg-orange-500 text-white' :
                annotation.severity === 'low' ? 'bg-blue-500 text-white' :
                'bg-green-500 text-white'
              }`}
            style={{ left: `${x}%`, top: `${y}%` }}
            title={annotation.note}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Show annotation details popover
            }}
          >
            {displayLabel}
          </div>
        );
      })}
    </div>
  );
}
