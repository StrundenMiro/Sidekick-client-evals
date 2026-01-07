/**
 * Test Prompts Loader
 *
 * Loads and provides access to the test prompts for each test type and format.
 */

import testPromptsData from '../../test-prompts.json';

export interface TestPrompt {
  title: string;
  text: string;
}

export interface FormatPrompts {
  name: string;
  description?: string;
  prompts: TestPrompt[];
}

export interface TestPromptsByFormat {
  [format: string]: FormatPrompts;
}

// Map test type IDs to prompt keys
const TEST_TYPE_TO_PROMPT_KEY: Record<string, string> = {
  'ai-generated-iteration': 'greenfield',
  'existing-content-iteration': 'brownfield',
};

/**
 * Get all prompts for a given test type, grouped by format
 */
export function getPromptsForTestType(testTypeId: string): TestPromptsByFormat | null {
  const promptKey = TEST_TYPE_TO_PROMPT_KEY[testTypeId];
  if (!promptKey) return null;

  return (testPromptsData as Record<string, TestPromptsByFormat>)[promptKey] || null;
}

/**
 * Get prompts for a specific format within a test type
 */
export function getPromptsForFormat(testTypeId: string, format: string): FormatPrompts | null {
  const prompts = getPromptsForTestType(testTypeId);
  if (!prompts) return null;

  return prompts[format] || null;
}

/**
 * Get the format order for displaying prompts
 */
export const FORMAT_DISPLAY_ORDER = [
  'table', 'document', 'stickies', 'flowchart', 'prototype',
  'slides', 'image', 'mindmap', 'erd'
];
