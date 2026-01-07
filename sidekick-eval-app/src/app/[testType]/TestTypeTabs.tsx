'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import RatingBadge from '@/components/RatingBadge';
import { TestPromptsByFormat, FORMAT_DISPLAY_ORDER } from '@/lib/test-prompts';

type TabType = 'runs' | 'prompts' | 'criteria';

interface FormatInfo {
  id: string;
  name: string;
  runCount: number;
  latestRating: string;
  latestDate: string;
}

interface TestTypeTabsProps {
  testType: string;
  formatList: FormatInfo[];
  testPrompts: TestPromptsByFormat | null;
  evaluationFocus: string[];
}

export default function TestTypeTabs({
  testType,
  formatList,
  testPrompts,
  evaluationFocus
}: TestTypeTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get('tab') as TabType | null;
  const validTabs: TabType[] = ['runs', 'prompts', 'criteria'];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'runs';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'runs') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  // Sync with URL on mount and when URL changes
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => handleTabChange('runs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'runs'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Test Runs
          {formatList.length > 0 && (
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {formatList.reduce((sum, f) => sum + f.runCount, 0)}
            </span>
          )}
        </button>
        {testPrompts && (
          <button
            onClick={() => handleTabChange('prompts')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'prompts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Prompts
          </button>
        )}
        <button
          onClick={() => handleTabChange('criteria')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'criteria'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Evaluation Criteria
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'runs' && (
        <section>
          {formatList.length > 0 ? (
            <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {formatList.map(format => (
                <li key={format.id}>
                  <Link
                    href={`/${testType}/${format.id}`}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">{format.name}</h3>
                        <p className="text-sm text-gray-500">
                          {format.runCount} run{format.runCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <RatingBadge rating={format.latestRating} size="sm" />
                        <span className="text-gray-300">&rarr;</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              No test runs yet for this test type.
            </div>
          )}
        </section>
      )}

      {activeTab === 'prompts' && testPrompts && (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {FORMAT_DISPLAY_ORDER
            .filter(format => testPrompts[format])
            .map(format => {
              const formatData = testPrompts[format];
              return (
                <div key={format} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-medium text-gray-900">{formatData.name}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {formatData.prompts.length} prompt{formatData.prompts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {formatData.description && (
                    <p className="text-sm text-gray-500 mb-3 italic">{formatData.description}</p>
                  )}
                  <ol className="space-y-2">
                    {formatData.prompts.map((prompt, i) => (
                      <li key={i} className="text-sm">
                        <div className="flex gap-2">
                          <span className="text-gray-400 font-mono text-xs mt-0.5">V{i + 1}</span>
                          <div>
                            <span className="font-medium text-gray-700">{prompt.title}</span>
                            <p className="text-gray-500 mt-0.5">{prompt.text}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
        </div>
      )}

      {activeTab === 'criteria' && (
        <ul className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {evaluationFocus.map((focus, i) => (
            <li key={i} className="text-sm text-gray-700 flex gap-3">
              <span className="text-blue-500 font-medium">{i + 1}.</span>
              {focus}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
