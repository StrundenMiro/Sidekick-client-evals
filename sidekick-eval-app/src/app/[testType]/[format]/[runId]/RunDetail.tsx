'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Lightbox from '@/components/Lightbox';
import RatingBadge from '@/components/RatingBadge';
import PromptAnnotation from '@/components/PromptAnnotation';
import type { Run, CaptureRun, ScoredRun, LegacyRun, CapturePrompt, ScoredPrompt, VisualEvaluation, Rating } from '@/lib/runs';

// Annotation type for props
interface Annotation {
  id: string;
  runId: string;
  promptNumber: number;
  issueType: string;
  severity: 'high' | 'medium' | 'low';
  note: string;
  createdAt: string;
  updatedAt: string;
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'pass': return 'bg-green-100 text-green-700';
    case 'fail': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getRunRating(run: Run): Rating | null {
  if (!isScored(run)) return null;
  if ('rating' in run && run.rating) return run.rating;
  if (run.scores) {
    const score = run.scores.overall;
    if (score >= 8) return 'great';
    if (score >= 5) return 'good';
    return 'bad';
  }
  return null;
}

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
  annotationsByPrompt?: Record<number, Annotation>;
}

export default function RunDetail({ run, testType, format, nav, annotationsByPrompt = {} }: Props) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const scored = isScored(run);
  const capturing = isCapturing(run);

  const RunNav = () => {
    if (!nav || nav.totalRuns <= 1) return null;
    return (
      <div className="flex items-center gap-1 text-sm">
        {nav.prevRunId ? (
          <Link
            href={`/${testType}/${format}/${nav.prevRunId}`}
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
            href={`/${testType}/${format}/${nav.nextRunId}`}
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
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">{run.id}</h1>
          {'state' in run && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              run.state === 'capturing' ? 'bg-blue-100 text-blue-700' :
              run.state === 'captured' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {run.state === 'capturing' ? 'Capturing' :
               run.state === 'captured' ? 'Pending Score' : 'Scored'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-500">{new Date(run.timestamp).toISOString().split('T')[0]}</p>
          <RunNav />
        </div>

        {/* Rating */}
        {scored && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <RatingBadge rating={getRunRating(run)} size="lg" />
          </div>
        )}
        {capturing && (
          <p className="text-gray-400 text-sm mt-2">
            {run.prompts.length}/3 prompts captured
          </p>
        )}
      </header>

      {/* Good/Bad Summary (only for scored runs) */}
      {scored && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                What worked
              </h3>
              {run.good.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {run.good.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-green-500">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm italic">No items</p>
              )}
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                What didn&apos;t work
              </h3>
              {run.bad.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {run.bad.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-red-500">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm italic">No issues</p>
              )}
            </div>
          </div>
        )}

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
        <div className="space-y-4">
          {run.prompts.map((prompt) => {
            const promptScored = isScoredPrompt(prompt);

            return (
              <div key={prompt.number} id={`v${prompt.number}`} className="bg-white rounded-lg shadow-sm overflow-hidden scroll-mt-6">
                {/* Prompt Header */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-100 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    V{prompt.number}: {prompt.title}
                  </h3>
                  {promptScored ? (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getStatusClass(prompt.status)}`}>
                      {prompt.status}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      Captured
                    </span>
                  )}
                </div>

                {/* Prompt Content */}
                <div className="p-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Prompt:</p>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">
                      {prompt.text}
                    </p>
                  </div>

                  <div className="mb-4">
                    {promptScored ? (
                      <>
                        {/* Frank's AI take */}
                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                            🤖
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Frank&apos;s take</p>
                            <p className="text-gray-700">{prompt.note}</p>

                            {/* Show evaluation issues only when present */}
                            {prompt.evaluation && hasEvaluationIssues(prompt.evaluation) && (
                              <EvaluationIssues evaluation={prompt.evaluation} />
                            )}
                          </div>
                        </div>

                        {/* Human take */}
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                          <PromptAnnotation
                            runId={run.id}
                            promptNumber={prompt.number}
                            initialAnnotation={annotationsByPrompt[prompt.number] || null}
                            minimal
                          />
                        </div>
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

                  {/* Artifact Image */}
                  {prompt.artifact && (
                    <div
                      className="relative cursor-pointer group"
                      onClick={() => setLightboxImage(`/${prompt.artifact}`)}
                    >
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
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
              </div>
            );
          })}
        </div>

      {/* Lightbox */}
      {lightboxImage && (
        <Lightbox
          src={lightboxImage}
          alt="Artifact"
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
