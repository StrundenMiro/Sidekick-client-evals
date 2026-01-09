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
      'Prompt Adherence — All requested content present, nothing missing or wrong',
      'Content Quality — Specific, useful content (not generic placeholder text)',
      'Visual Quality — Clean layout, readable text, no truncation or layout bugs',
      'Iteration Continuity — V2 builds on V1, V3 builds on V2 (not starting fresh)',
      'Style Preservation — Style maintained unless explicitly asked to change',
      'Text Integrity — No garbled text, broken labels, or mid-word truncation',
      'Format-Specific — Correct structure for the output type (tables have columns, flows have connections, etc.)'
    ]
  },

  'existing-content-iteration': {
    id: 'existing-content-iteration',
    name: 'Iteration from Existing Board Content',
    shortName: 'Existing Content',
    description: 'Tests how well Sidekick works with and improves existing content on the board. Evaluates understanding of context and appropriate modifications.',
    promptStructure: 'V0: Existing content | V1: First edit | V2: Second edit | V3: Third edit',
    evaluationFocus: [
      'Context Understanding — Did it understand the existing content before modifying?',
      'In-Place Editing — Modified existing content (not created new from scratch)',
      'Content Preservation — Kept what wasn\'t asked to change, no unexpected data loss',
      'Style Preservation — Maintained colors, fonts, structure unless asked to change',
      'Iteration Continuity — V1→V2→V3 builds progressively, each version builds on previous',
      'Visual Quality — Clean layout, readable text, no truncation or garbled characters',
      'No Regressions — Later versions don\'t lose changes made in earlier versions'
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
  },

  'image-to-prototype': {
    id: 'image-to-prototype',
    name: 'Image to Prototype Conversion',
    shortName: 'Image to Prototype',
    description: 'Tests how well Sidekick converts a source image into an interactive prototype with additional features.',
    promptStructure: 'V0: Source image | V1: Generated prototype with requested additions',
    evaluationFocus: [
      'Source Understanding — Did it capture the key elements from the source image?',
      'Prompt Adherence — Did it add what was requested in the prompt?',
      'Visual Quality — Clean layout, readable text, professional appearance',
      'Style Fidelity — Does the prototype match the style/vibe of the source?',
      'Completeness — All expected screens/components present',
      'Usability — Is the generated prototype functional and usable?'
    ]
  }
};

export const TEST_TYPE_ORDER = [
  'ai-generated-iteration',
  'existing-content-iteration',
  'conversational-flow',
  'image-to-prototype'
];

export function getTestType(id: string): TestType | undefined {
  return TEST_TYPES[id];
}

export function getAllTestTypes(): TestType[] {
  return TEST_TYPE_ORDER.map(id => TEST_TYPES[id]);
}
