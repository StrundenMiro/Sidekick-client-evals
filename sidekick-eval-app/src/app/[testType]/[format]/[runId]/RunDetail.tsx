'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Lightbox from '@/components/Lightbox';
import PromptAnnotation from '@/components/PromptAnnotation';
import type { Run, CaptureRun, ScoredRun, LegacyRun, CapturePrompt, ScoredPrompt, VisualEvaluation } from '@/lib/runs';
import type { Annotation } from '@/lib/annotations';

function isScored(run: Run): run is ScoredRun | LegacyRun {
  return !('state' in run) || run.state === 'scored';
}

function isCapturing(run: Run): run is CaptureRun {
  return 'state' in run && (run.state === 'capturing' || run.state === 'captured');
}

function isScoredPrompt(prompt: CapturePrompt | ScoredPrompt): prompt is ScoredPrompt {
  return 'status' in prompt;
}

function hasEvaluationIssues(evaluation?: VisualEvaluation): boolean {
  if (!evaluation) return false;
  return (
    evaluation.promptAdherence.issues.length > 0 ||
    evaluation.visualQuality.glitches.length > 0 ||
    evaluation.copyQuality.issues.length > 0 ||
    evaluation.styleConsistency.issues.length > 0 ||
    evaluation.improvements.length > 0
  );
}

function EvaluationIssues({ evaluation }: { evaluation: VisualEvaluation }) {
  const sections = [
    {
      title: 'Prompt Adherence Issues',
      items: evaluation.promptAdherence.issues,
      color: 'text-orange-600',
      show: evaluation.promptAdherence.issues.length > 0
    },
    {
      title: 'Visual Glitches',
      items: evaluation.visualQuality.glitches,
      color: 'text-red-600',
      show: evaluation.visualQuality.glitches.length > 0
    },
    {
      title: 'Copy Issues',
      items: evaluation.copyQuality.issues,
      color: 'text-yellow-600',
      show: evaluation.copyQuality.issues.length > 0
    },
    {
      title: 'Style Issues',
      items: evaluation.styleConsistency.issues,
      color: 'text-purple-600',
      show: evaluation.styleConsistency.issues.length > 0
    },
    {
      title: 'Suggested Improvements',
      items: evaluation.improvements,
      color: 'text-blue-600',
      show: evaluation.improvements.length > 0
    }
  ].filter(s => s.show);

  if (sections.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      {sections.map(section => (
        <div key={section.title}>
          <p className={`text-xs font-medium ${section.color} mb-1`}>{section.title}:</p>
          <ul className="text-sm text-gray-600 space-y-0.5">
            {section.items.map((item, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-gray-400">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface RunNavInfo {
  prevRunId: string | null;
  nextRunId: string | null;
  currentIndex: number;
  totalRuns: number;
}

interface Props {
  run: Run;
  testType: string;
  format: string;
  nav?: RunNavInfo;
  annotationsByPrompt?: Record<number, Annotation[]>;
}

export default function RunDetail({ run, testType, format, nav, annotationsByPrompt = {} }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>(() => {
    // Initialize from URL param
    const layoutParam = searchParams.get('layout');
    return layoutParam === 'horizontal' ? 'horizontal' : 'vertical';
  });
  const [imageTopOffset, setImageTopOffset] = useState<number>(0);
  const [copied, setCopied] = useState<string | null>(null); // null or the id that was copied
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Helper to build nav links with layout preserved
  const getNavLink = (runId: string) => {
    const params = new URLSearchParams();
    if (layout === 'horizontal') {
      params.set('layout', 'horizontal');
    }
    const queryString = params.toString();
    return queryString ? `/${testType}/${format}/${runId}?${queryString}` : `/${testType}/${format}/${runId}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/runs?id=${run.id}`, { method: 'DELETE' });
      if (res.ok) {
        // Navigate to next run, or previous, or back to format page
        if (nav?.nextRunId) {
          router.push(getNavLink(nav.nextRunId));
        } else if (nav?.prevRunId) {
          router.push(getNavLink(nav.prevRunId));
        } else {
          router.push(`/format/${format}`);
        }
      }
    } catch (error) {
      console.error('Failed to delete run:', error);
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  // Update URL when layout changes (without full navigation)
  const updateLayout = (newLayout: 'vertical' | 'horizontal') => {
    setLayout(newLayout);
    const params = new URLSearchParams(searchParams.toString());
    if (newLayout === 'horizontal') {
      params.set('layout', 'horizontal');
    } else {
      params.delete('layout');
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  // Scroll to anchor on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, []);

  const copyShareLink = async (anchor?: string) => {
    try {
      const url = anchor
        ? `${window.location.origin}${window.location.pathname}#${anchor}`
        : window.location.href.split('#')[0]; // Remove any existing hash for report-level share
      await navigator.clipboard.writeText(url);
      setCopied(anchor || 'report');
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Measure content heights and find the max for image alignment
  useEffect(() => {
    if (layout === 'horizontal') {
      // Use requestAnimationFrame to ensure DOM is rendered
      const measure = () => {
        const heights = contentRefs.current
          .filter(ref => ref !== null)
          .map(ref => ref!.scrollHeight); // Use scrollHeight to get natural height
        if (heights.length > 0) {
          const maxHeight = Math.max(...heights);
          setImageTopOffset(prev => prev !== maxHeight ? maxHeight : prev);
        }
      };
      // Measure after a brief delay to let content render
      const timeout = setTimeout(measure, 100);
      return () => clearTimeout(timeout);
    } else {
      setImageTopOffset(0);
    }
  }, [layout]);

  // Collect all artifact images
  const allImages = run.prompts
    .filter(p => p.artifact)
    .map(p => `/${p.artifact}`);
  const scored = isScored(run);
  const capturing = isCapturing(run);

  const RunNav = () => {
    if (!nav || nav.totalRuns <= 1) return null;
    return (
      <div className="flex items-center gap-1 text-sm">
        {nav.prevRunId ? (
          <Link
            href={getNavLink(nav.prevRunId)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          >
            ←
          </Link>
        ) : (
          <span className="w-7 h-7 flex items-center justify-center text-gray-300">←</span>
        )}
        <span className="text-gray-500 px-1">
          {nav.currentIndex + 1} of {nav.totalRuns}
        </span>
        {nav.nextRunId ? (
          <Link
            href={getNavLink(nav.nextRunId)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          >
            →
          </Link>
        ) : (
          <span className="w-7 h-7 flex items-center justify-center text-gray-300">→</span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          {/* Left: Status */}
          <div className="flex items-center gap-3">
            {capturing && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                (run as CaptureRun).state === 'capturing' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {(run as CaptureRun).state === 'capturing' ? 'Capturing' : 'Pending Score'}
              </span>
            )}
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center">
            <RunNav />
          </div>

          {/* Right: Layout toggle + Delete */}
          <div className="flex items-center gap-2">
            {scored && (
              <button
                onClick={() => updateLayout(layout === 'vertical' ? 'horizontal' : 'vertical')}
                className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title={layout === 'vertical' ? 'Switch to horizontal' : 'Switch to vertical'}
              >
                {layout === 'vertical' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="3" width="5" height="10" rx="1" />
                    <rect x="9" y="3" width="5" height="10" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="12" height="5" rx="1" />
                    <rect x="2" y="9" width="12" height="5" rx="1" />
                  </svg>
                )}
              </button>
            )}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeleting ? '...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 rounded text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete run"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {capturing && (
          <p className="text-gray-400 text-sm mt-2">
            {run.prompts.length}/3 prompts captured
          </p>
        )}
      </header>


        {/* Iteration Analysis (only show if there are regressions) */}
        {scored && 'iterationAnalysis' in run && run.iterationAnalysis?.regressions && run.iterationAnalysis.regressions.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-700 mb-2">Regressions Detected</h3>
            <p className="text-red-600 text-sm mb-2">These issues got worse between iterations:</p>
            <ul className="space-y-1">
              {run.iterationAnalysis.regressions.map((regression, i) => (
                <li key={i} className="text-sm text-red-700 flex gap-2">
                  <span>-</span>
                  {regression}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pending score notice for captured runs */}
        {capturing && (run as CaptureRun).state === 'captured' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-medium">Ready for Scoring</p>
            <p className="text-yellow-700 text-sm">
              All prompts captured. This run is waiting to be evaluated.
            </p>
          </div>
        )}

        {/* Prompts */}
        <div className={layout === 'horizontal'
          ? 'flex gap-4 overflow-x-auto pb-4 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-6'
          : 'space-y-4'
        }
        style={layout === 'horizontal' ? { scrollbarWidth: 'thin' } : undefined}
        >
          {run.prompts.map((prompt) => {
            const promptScored = isScoredPrompt(prompt);

            return (
              <div
                key={prompt.number}
                id={`v${prompt.number}`}
                className={`bg-white rounded-lg shadow-sm overflow-hidden scroll-mt-6 ${
                  layout === 'horizontal' ? 'flex-shrink-0 w-[600px] flex flex-col' : ''
                }`}
              >
                {/* Prompt Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    V{prompt.number}: {prompt.title}
                  </h3>
                  <button
                    onClick={() => copyShareLink(`v${prompt.number}`)}
                    className="text-gray-300 hover:text-gray-500 text-xs transition-colors"
                    title="Copy link to this version"
                  >
                    {copied === `v${prompt.number}` ? '✓' : '#'}
                  </button>
                </div>

                {/* Prompt Content */}
                <div
                  className="p-4"
                  ref={el => { contentRefs.current[prompt.number] = el; }}
                  style={layout === 'horizontal' && imageTopOffset > 0 ? { minHeight: imageTopOffset } : undefined}
                >
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Prompt:</p>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">
                      {prompt.text}
                    </p>
                  </div>

                  <div className="mb-4">
                    {promptScored ? (
                      <>
                        {/* All annotations (Frank + Human) */}
                        <PromptAnnotation
                            runId={run.id}
                            promptNumber={prompt.number}
                            initialAnnotations={annotationsByPrompt[prompt.number] || []}
                            minimal
                          />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500 mb-1">Observation:</p>
                        <p className="text-gray-700">
                          {(prompt as CapturePrompt).observation || 'No observation recorded'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Artifact Image */}
                {prompt.artifact && (
                  <div
                    className="relative cursor-pointer group px-4 pb-4"
                    onClick={() => {
                      const imageIndex = allImages.indexOf(`/${prompt.artifact}`);
                      setLightboxIndex(imageIndex >= 0 ? imageIndex : 0);
                    }}
                  >
                    <div className="absolute inset-4 top-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-3 py-1 rounded text-sm transition-opacity">
                        Click to zoom
                      </span>
                    </div>
                    <Image
                      src={`/${prompt.artifact}`}
                      alt={`V${prompt.number} artifact`}
                      width={800}
                      height={400}
                      className="rounded-lg border border-gray-200 w-full"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      {/* Lightbox */}
      {lightboxIndex !== null && allImages[lightboxIndex] && (
        <Lightbox
          src={allImages[lightboxIndex]}
          alt="Artifact"
          onClose={() => setLightboxIndex(null)}
          images={allImages}
          currentIndex={lightboxIndex}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
