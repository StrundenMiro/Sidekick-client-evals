'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type IssueTheme } from '@/lib/runs';

function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function ThemeCard({ theme }: { theme: IssueTheme }) {
  const [copied, setCopied] = useState(false);

  // Split description and manifestations
  const [mainDescription, manifestationsSection] = theme.description.split('\n\nManifests as:\n');
  const manifestations = manifestationsSection
    ? manifestationsSection.split('\n').filter(m => m.startsWith('• ')).map(m => m.slice(2))
    : [];

  const handleCopy = async () => {
    const firstOccurrence = theme.occurrences[0];

    // Professional Jira format for EPD audience
    const jiraText = `h2. ${theme.title}

||Severity||${theme.severity.toUpperCase()}||
||Affected Formats||${theme.affectedFormats.join(', ')}||
||Occurrences||${theme.count} test runs||

h3. Description
${mainDescription}

${manifestations.length > 0 ? `h3. How It Manifests
${manifestations.map(m => `* ${m}`).join('\n')}

` : ''}h3. Steps to Reproduce
# Open Sidekick AI on a Miro board
# Select context frame with relevant content
# Run a multi-prompt iteration flow (e.g., "create X" → "edit X" → "enhance X")
# Observe behavior at prompt 2 or 3

h3. Evidence
*Test Runs:*
${theme.occurrences.slice(0, 5).map(o => `* ${o.runId} (${o.format})`).join('\n')}

*Internal Reference:* Frank evaluation tool - AI Generated Iteration tests`;

    try {
      await navigator.clipboard.writeText(jiraText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getSeverityStyle(theme.severity)}`}>
              {theme.severity}
            </span>
            <span className="text-xs text-gray-500">
              {theme.count} run{theme.count !== 1 ? 's' : ''} across {theme.affectedFormats.length} format{theme.affectedFormats.length !== 1 ? 's' : ''}
            </span>
          </div>

          <h3 className="font-semibold text-gray-900 text-lg mb-2">{theme.title}</h3>
          <p className="text-gray-600 text-sm mb-3">{mainDescription}</p>

          {/* Manifestations */}
          {manifestations.length > 0 && (
            <div className="mb-4 bg-red-50 rounded-lg p-3">
              <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2">Manifests as:</p>
              <ul className="space-y-1">
                {manifestations.map((m, idx) => (
                  <li key={idx} className="text-sm text-red-800 flex gap-2">
                    <span className="text-red-400">→</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Affected formats */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {theme.affectedFormats.map(format => (
              <span
                key={format}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize"
              >
                {format}
              </span>
            ))}
          </div>

          {/* Evidence runs */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Evidence:</p>
            <div className="flex flex-wrap gap-2">
              {theme.occurrences.slice(0, 4).map((occ, idx) => (
                <Link
                  key={idx}
                  href={`/ai-generated-iteration/${occ.format}/${occ.runId}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {occ.runId}
                </Link>
              ))}
              {theme.occurrences.length > 4 && (
                <span className="text-xs text-gray-400">
                  +{theme.occurrences.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded transition-colors ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {copied ? 'Copied!' : 'Copy for Jira'}
        </button>
      </div>
    </div>
  );
}

interface HitListClientProps {
  themes: IssueTheme[];
}

export default function HitListClient({ themes }: HitListClientProps) {
  const highCount = themes.filter(t => t.severity === 'high').length;
  const mediumCount = themes.filter(t => t.severity === 'medium').length;
  const lowCount = themes.filter(t => t.severity === 'low').length;

  return (
    <>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎯</span>
          <h1 className="text-2xl font-bold text-gray-900">Issues I Found</h1>
        </div>
        <p className="text-gray-600 mb-4">
          Things that made me start over or give up. I should be able to create something, iterate on it a few times, and end up with a polished result &mdash; without fighting the tool.
        </p>

        <div className="flex gap-4">
          {highCount > 0 && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityStyle('high')}`}>
              {highCount} Critical
            </span>
          )}
          {mediumCount > 0 && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityStyle('medium')}`}>
              {mediumCount} Important
            </span>
          )}
          {lowCount > 0 && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityStyle('low')}`}>
              {lowCount} Minor
            </span>
          )}
        </div>
      </header>

      {/* High Severity Themes */}
      {highCount > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Critical Issues
          </h2>
          <div className="space-y-4">
            {themes.filter(t => t.severity === 'high').map(theme => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </section>
      )}

      {/* Medium Severity Themes */}
      {mediumCount > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-yellow-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Important Issues
          </h2>
          <div className="space-y-4">
            {themes.filter(t => t.severity === 'medium').map(theme => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </section>
      )}

      {/* Low Severity Themes */}
      {lowCount > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Minor Issues
          </h2>
          <div className="space-y-4">
            {themes.filter(t => t.severity === 'low').map(theme => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </section>
      )}

      {themes.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <span className="text-4xl mb-4 block">🎉</span>
          <p className="text-gray-500">No issues found! All tests are passing.</p>
        </div>
      )}
    </>
  );
}
