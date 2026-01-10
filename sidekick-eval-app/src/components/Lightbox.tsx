'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
  images?: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export default function Lightbox({ src, alt, onClose, images, currentIndex = 0, onNavigate }: LightboxProps) {
  const canNavigate = images && images.length > 1 && onNavigate;
  const hasPrev = canNavigate && currentIndex > 0;
  const hasNext = canNavigate && currentIndex < images.length - 1;
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [compareMode, setCompareMode] = useState(true); // Default to compare mode
  const [compareLayout, setCompareLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [compareIndex, setCompareIndex] = useState(Math.max(0, currentIndex - 1));
  const containerRef = useRef<HTMLDivElement>(null);

  // Update compare index when current index changes
  useEffect(() => {
    if (currentIndex > 0) {
      setCompareIndex(currentIndex - 1);
    } else if (images && images.length > 1) {
      setCompareIndex(1);
    }
  }, [currentIndex, images]);

  // Handle wheel/trackpad gestures
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.ctrlKey) {
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      setScale(prev => Math.min(Math.max(prev * delta, 0.5), 5));
    } else {
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Reset position when navigating to new image
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(prev => Math.min(prev * 1.2, 5));
      if (e.key === '-') setScale(prev => Math.max(prev * 0.8, 0.5));
      if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
      if (e.key === 'c') setCompareMode(prev => !prev);
      if (e.key === 'v') setCompareLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
      if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate!(currentIndex - 1);
      }
      if (e.key === 'ArrowRight' && hasNext) {
        onNavigate!(currentIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, hasPrev, hasNext, currentIndex, onNavigate]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const preventGesture = (e: Event) => e.preventDefault();

    document.addEventListener('wheel', preventZoom, { passive: false });
    document.addEventListener('gesturestart', preventGesture);
    document.addEventListener('gesturechange', preventGesture);
    document.addEventListener('gestureend', preventGesture);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', preventZoom);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
  }, []);

  const canCompare = images && images.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {canCompare && compareMode && (
          <button
            onClick={(e) => { e.stopPropagation(); setCompareLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal'); }}
            className="px-3 h-10 rounded-full text-white text-sm flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20"
            title={compareLayout === 'horizontal' ? 'Stack vertically' : 'Show side by side'}
          >
            {compareLayout === 'horizontal' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="7" rx="1" />
                <rect x="3" y="14" width="18" height="7" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
            )}
          </button>
        )}
        {canCompare && (
          <button
            onClick={(e) => { e.stopPropagation(); setCompareMode(prev => !prev); }}
            className={`px-3 h-10 rounded-full text-white text-sm flex items-center justify-center gap-2 ${
              compareMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {compareMode ? 'Single' : 'Compare'}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(prev * 1.3, 5)); }}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full text-white text-xl flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setScale(prev => Math.max(prev * 0.7, 0.5)); }}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full text-white text-xl flex items-center justify-center"
        >
          -
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({ x: 0, y: 0 }); }}
          className="px-3 h-10 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm flex items-center justify-center"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full text-white text-2xl flex items-center justify-center"
        >
          &times;
        </button>
      </div>

      {/* Navigation arrows - only in single view mode */}
      {!compareMode && hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate!(currentIndex - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full text-white text-2xl flex items-center justify-center z-10"
        >
          ←
        </button>
      )}
      {!compareMode && hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate!(currentIndex + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full text-white text-2xl flex items-center justify-center z-10"
        >
          →
        </button>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-white/60 text-sm">
        {compareMode
          ? `${Math.round(scale * 100)}% · V to toggle layout · C for single · 0 to reset`
          : `${canNavigate ? `${currentIndex + 1}/${images.length} · ` : ''}${Math.round(scale * 100)}% · ${canCompare ? 'C to compare · ' : ''}← → to navigate · 0 to reset`
        }
      </div>

      {/* Compare mode: all artifacts together, zoom together */}
      {compareMode && images ? (
        <div
          ref={containerRef}
          className="relative overflow-hidden w-full h-full flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div
            className={`${compareLayout === 'horizontal' ? 'flex flex-row gap-4' : 'flex flex-col gap-4'} items-center`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {images.map((imgSrc, i) => (
              <div key={i} className={`flex items-center gap-2 ${compareLayout === 'horizontal' ? 'flex-col' : 'flex-row'}`}>
                <div className={`text-white text-xs px-2 py-1 rounded font-medium ${
                  i === currentIndex ? 'bg-blue-600' : 'bg-white/30'
                }`}>
                  V{i + 1}
                </div>
                <div
                  className={`rounded-lg overflow-hidden ${
                    i === currentIndex ? 'ring-2 ring-blue-500' : 'ring-1 ring-white/30'
                  }`}
                >
                  <Image
                    src={imgSrc}
                    alt={`Version ${i + 1}`}
                    width={800}
                    height={600}
                    className={`select-none ${
                      compareLayout === 'horizontal' ? 'max-h-[75vh] w-auto' : 'max-w-[90vw] h-auto'
                    }`}
                    draggable={false}
                    unoptimized
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Single image view */
        <div
          ref={containerRef}
          className="relative overflow-hidden w-full h-full flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="max-w-none select-none"
              style={{ maxHeight: '90vh', width: 'auto' }}
              draggable={false}
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
