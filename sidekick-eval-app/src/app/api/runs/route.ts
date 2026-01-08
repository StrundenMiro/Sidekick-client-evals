import { NextRequest, NextResponse } from 'next/server';
import { saveRunAsync, getRunsAsync, type Run } from '@/lib/runs';

// GET all runs
export async function GET() {
  try {
    const runs = await getRunsAsync();
    return NextResponse.json({ runs });
  } catch (error) {
    console.error('Failed to get runs:', error);
    return NextResponse.json(
      { error: 'Failed to get runs' },
      { status: 500 }
    );
  }
}

// POST to save a new or updated run
export async function POST(request: NextRequest) {
  try {
    const run: Run = await request.json();

    if (!run.id || !run.format || !run.timestamp) {
      return NextResponse.json(
        { error: 'id, format, and timestamp are required' },
        { status: 400 }
      );
    }

    await saveRunAsync(run);
    return NextResponse.json({ success: true, run });
  } catch (error) {
    console.error('Failed to save run:', error);
    return NextResponse.json(
      { error: 'Failed to save run' },
      { status: 500 }
    );
  }
}
