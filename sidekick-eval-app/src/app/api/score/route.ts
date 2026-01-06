import { NextRequest, NextResponse } from 'next/server';
import { scoreRun, ScoreInput } from '@/lib/runs';

export async function POST(request: NextRequest) {
  try {
    const body: ScoreInput = await request.json();
    const { runId, scores, good, bad, promptEvaluations } = body;

    if (!runId || !scores || !promptEvaluations) {
      return NextResponse.json(
        { error: 'runId, scores, and promptEvaluations are required' },
        { status: 400 }
      );
    }

    // Validate scores
    if (
      typeof scores.overall !== 'number' ||
      typeof scores.promptAdherence !== 'number' ||
      typeof scores.iterationQuality !== 'number'
    ) {
      return NextResponse.json(
        { error: 'scores must include overall, promptAdherence, and iterationQuality as numbers' },
        { status: 400 }
      );
    }

    const run = scoreRun({
      runId,
      scores,
      good: good || [],
      bad: bad || [],
      promptEvaluations
    });

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found or not ready for scoring' },
        { status: 404 }
      );
    }

    return NextResponse.json(run);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to score run' },
      { status: 500 }
    );
  }
}
