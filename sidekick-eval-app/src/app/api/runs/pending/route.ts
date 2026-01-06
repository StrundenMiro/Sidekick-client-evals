import { NextResponse } from 'next/server';
import { getPendingRuns, getCapturingRuns } from '@/lib/runs';

export async function GET() {
  try {
    const pending = getPendingRuns();
    const capturing = getCapturingRuns();

    return NextResponse.json({
      pending,    // Ready for scoring
      capturing   // Still in progress
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get pending runs' },
      { status: 500 }
    );
  }
}
