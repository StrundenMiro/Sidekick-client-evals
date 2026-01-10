'use client';

import type { Annotation } from '@/lib/annotations';

interface ImageMarkerProps {
  annotation: Annotation;
  index: number;
  onClick: (e: React.MouseEvent) => void;
}

export default function ImageMarker({
  annotation,
  index,
  onClick
}: ImageMarkerProps) {
  if (annotation.target?.type !== 'image') return null;

  const { x, y, label } = annotation.target.marker;
  const displayLabel = label || String(index + 1);

  // Determine color based on severity
  const bgColor = annotation.severity === 'high' ? 'bg-red-500'
    : annotation.severity === 'medium' ? 'bg-orange-500'
    : annotation.severity === 'low' ? 'bg-blue-500'
    : 'bg-green-500';

  const hoverColor = annotation.severity === 'high' ? 'hover:bg-red-600'
    : annotation.severity === 'medium' ? 'hover:bg-orange-600'
    : annotation.severity === 'low' ? 'hover:bg-blue-600'
    : 'hover:bg-green-600';

  return (
    <div
      className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white z-20 cursor-pointer transition-transform hover:scale-110 ${bgColor} ${hoverColor}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      title={annotation.note}
      onClick={onClick}
    >
      {displayLabel}
    </div>
  );
}
