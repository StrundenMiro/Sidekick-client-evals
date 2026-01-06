/**
 * Scoring Criteria for Sidekick AI Evaluation
 *
 * When scoring a run, evaluate each artifact against these criteria.
 * The scorer should examine the actual images, not just descriptions.
 */

export interface VisualEvaluation {
  // Does the output match what the prompt asked for?
  promptAdherence: {
    score: number;  // 1-10
    notes: string;
    issues: string[];  // Specific ways it deviated from prompt
  };

  // Are there rendering problems, misalignments, artifacts?
  visualQuality: {
    score: number;  // 1-10
    glitches: string[];  // e.g., "Text overlapping image", "Cropped content"
    alignmentIssues: string[];  // e.g., "Headers not aligned", "Uneven spacing"
    renderingProblems: string[];  // e.g., "Blurry images", "Missing elements"
  };

  // Is the text content correct and appropriate?
  copyQuality: {
    score: number;  // 1-10
    issues: string[];  // e.g., "Spelling error in heading", "Lorem ipsum placeholder"
    coherence: string;  // Does the text make sense in context?
    tone: string;  // Does it match expected tone/voice?
  };

  // Do colors and visual elements match the expected style?
  styleConsistency: {
    score: number;  // 1-10
    colorIssues: string[];  // e.g., "Wrong brand color", "Poor contrast"
    assetIssues: string[];  // e.g., "Generic stock photo", "Mismatched icons"
    brandAlignment: string;  // How well does it match the brand/style guide?
  };

  // What could be better?
  improvements: string[];
}

export interface PromptEvaluation {
  promptNumber: number;
  title: string;
  visual: VisualEvaluation;
  overallStatus: 'pass' | 'warning' | 'fail';
  summary: string;  // 1-2 sentence summary of this version
}

export interface RunEvaluation {
  runId: string;

  // Individual prompt evaluations
  prompts: PromptEvaluation[];

  // Cross-version analysis
  iterationAnalysis: {
    v1ToV2: string;  // How did V2 address V1 feedback?
    v2ToV3: string;  // How did V3 address V2 feedback?
    progressionQuality: number;  // 1-10: Did iterations actually improve?
    regressions: string[];  // Things that got worse between versions
  };

  // Final scores
  scores: {
    promptAdherence: number;  // Average of individual prompt adherence
    iterationQuality: number;  // Based on progression analysis
    overall: number;  // Weighted combination
  };

  // Summary lists
  good: string[];  // What worked well
  bad: string[];   // What didn't work
}

/**
 * Scoring Guide (3-Tier: Bad / Good / Great)
 *
 * PROMPT ADHERENCE:
 * Great: All requirements met, output matches intent perfectly
 * Good: Core requirements met, minor omissions or extras
 * Bad: Missed key requirements, doesn't match prompt intent
 *
 * VISUAL QUALITY:
 * Great: Professional, production-ready, no glitches
 * Good: Usable, minor visual issues that don't affect function
 * Bad: Significant glitches, layout problems, unusable
 *
 * COPY QUALITY:
 * Great: Correct spelling/grammar, appropriate tone, coherent
 * Good: Minor typos or awkward phrasing, meaning is clear
 * Bad: Errors affecting comprehension, placeholder text, incoherent
 *
 * STYLE CONSISTENCY:
 * Great: Matches expected style, colors, and assets
 * Good: Minor style variations, still looks intentional
 * Bad: Off-brand, mismatched styles, looks broken
 *
 * ITERATION QUALITY:
 * Great: Clear improvement each version, feedback addressed
 * Good: Some improvement, most feedback addressed
 * Bad: No improvement, feedback ignored, or got worse
 *
 * OVERALL RUN RATING:
 * Great: Sidekick nailed it - ready to use
 * Good: Sidekick did ok - usable with minor issues
 * Bad: Sidekick failed - needs significant rework
 */

export type Rating = 'great' | 'good' | 'bad';

export const EVALUATION_CHECKLIST = {
  promptAdherence: [
    'Does it include all requested elements?',
    'Does it follow the specified structure/format?',
    'Does it use the requested style/tone?',
    'Are there any extra elements not requested?',
    'Does it address the specific use case mentioned?'
  ],

  visualQuality: [
    'Is text fully readable (not cut off, overlapping)?',
    'Are elements properly aligned?',
    'Is spacing consistent throughout?',
    'Are images/icons rendering correctly?',
    'Is the layout balanced and professional?',
    'Are there any visual artifacts or glitches?'
  ],

  copyQuality: [
    'Is spelling correct throughout?',
    'Is grammar correct?',
    'Does the copy make sense in context?',
    'Is the tone appropriate for the use case?',
    'Are there any placeholder texts (Lorem ipsum)?',
    'Is the copy length appropriate?'
  ],

  styleConsistency: [
    'Do colors match the expected palette?',
    'Are fonts consistent and appropriate?',
    'Do icons/images match the visual style?',
    'Is there good contrast for readability?',
    'Does it look cohesive and intentional?'
  ],

  iteration: [
    'Did V2 address the main feedback from V1?',
    'Did V3 refine based on V2 feedback?',
    'Are improvements meaningful or superficial?',
    'Did any quality regress between versions?',
    'Is V3 clearly the best version?'
  ]
};
