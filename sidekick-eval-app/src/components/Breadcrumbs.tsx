'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split('#')[0]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <nav className="text-sm text-gray-500 mb-6">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-300">/</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-gray-900 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
              {isLast && !item.href && (
                <button
                  onClick={copyLink}
                  className="text-gray-300 hover:text-gray-500 transition-colors"
                  title="Copy link"
                >
                  {copied ? '✓' : '⧉'}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
