/**
 * Test Type Definitions
 *
 * Each test type evaluates a different aspect of Sidekick AI capability.
 */

export interface TestType {
  id: string;
  name: string;
  shortName: string;
  description: string;
  promptStructure: string;  // How prompts work for this test type
  evaluationFocus: string[];  // What to focus on when scoring
}

export const TEST_TYPES: Record<string, TestType> = {
  'ai-generated-iteration': {
    id: 'ai-generated-iteration',
    name: 'Iteration from AI Generated Result',
    shortName: 'AI Generated',
    description: 'Tests how well Sidekick iterates on its own generated content. V1 is created from scratch, V2 and V3 refine based on feedback.',
    promptStructure: 'V1: Initial generation prompt | V2: Feedback on V1 | V3: Refinement of V2',
    evaluationFocus: [
      'Quality of initial generation',
      'Response to iteration feedback',
      'Progressive improvement across versions',
      'Avoiding regressions'
    ]
  },

  'existing-content-iteration': {
    id: 'existing-content-iteration',
    name: 'Iteration from Existing Board Content',
    shortName: 'Existing Content',
    description: 'Tests how well Sidekick works with and improves existing content on the board. Evaluates understanding of context and appropriate modifications.',
    promptStructure: 'V1: Work with existing content | V2: Modify based on feedback | V3: Further refinement',
    evaluationFocus: [
      'Understanding of existing content',
      'Appropriate modifications (not over-changing)',
      'Preserving important elements',
      'Coherent integration with board context'
    ]
  },

  'conversational-flow': {
    id: 'conversational-flow',
    name: 'Conversational Flow',
    shortName: 'Conversation',
    description: 'Tests multi-turn conversation quality. Evaluates context retention, clarifying questions, and natural dialogue progression.',
    promptStructure: 'Series of back-and-forth exchanges testing dialogue quality',
    evaluationFocus: [
      'Context retention across turns',
      'Appropriate clarifying questions',
      'Natural conversation flow',
      'Helpful responses to follow-ups'
    ]
  }
};

export const TEST_TYPE_ORDER = [
  'ai-generated-iteration',
  'existing-content-iteration',
  'conversational-flow'
];

export function getTestType(id: string): TestType | undefined {
  return TEST_TYPES[id];
}

export function getAllTestTypes(): TestType[] {
  return TEST_TYPE_ORDER.map(id => TEST_TYPES[id]);
}
