import { NextRequest, NextResponse } from 'next/server';
import { completeCapture } from '@/lib/runs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId } = body;

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' },
        { status: 400 }
      );
    }

    const run = completeCapture(runId);

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found or not in capture state' },
        { status: 404 }
      );
    }

    return NextResponse.json(run);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to complete capture' },
      { status: 500 }
    );
  }
}
