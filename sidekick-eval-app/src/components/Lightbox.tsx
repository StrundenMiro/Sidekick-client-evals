'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function Lightbox({ src, alt, onClose }: LightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle wheel zoom (only on the image, not the page)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 5));
  };

  // Handle drag to pan - allow at any zoom level for wide images
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

  // Reset on double click
  const handleDoubleClick = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const panAmount = 100;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(prev => Math.min(prev * 1.2, 5));
      if (e.key === '-') setScale(prev => Math.max(prev * 0.8, 0.5));
      if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
      // Arrow keys for panning
      if (e.key === 'ArrowLeft') setPosition(prev => ({ ...prev, x: prev.x + panAmount }));
      if (e.key === 'ArrowRight') setPosition(prev => ({ ...prev, x: prev.x - panAmount }));
      if (e.key === 'ArrowUp') setPosition(prev => ({ ...prev, y: prev.y + panAmount }));
      if (e.key === 'ArrowDown') setPosition(prev => ({ ...prev, y: prev.y - panAmount }));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
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

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-white/60 text-sm">
        {Math.round(scale * 100)}% &middot; Drag or arrow keys to pan &middot; Scroll to zoom &middot; 0 to reset
      </div>

      {/* Image container */}
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
    </div>
  );
}
