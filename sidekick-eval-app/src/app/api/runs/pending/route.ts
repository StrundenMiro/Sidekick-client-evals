import { NextResponse } from 'next/server';
import { getPendingRunsAsync, getCapturingRunsAsync } from '@/lib/runs';

export async function GET() {
  try {
    const pending = await getPendingRunsAsync();
    const capturing = await getCapturingRunsAsync();

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
