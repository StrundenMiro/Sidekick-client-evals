import { NextRequest, NextResponse } from 'next/server';
import { saveCapturePromptAsync } from '@/lib/runs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, number, title, text, artifact, observation } = body;

    if (!runId || number === undefined || !title || !text) {
      return NextResponse.json(
        { error: 'runId, number, title, and text are required' },
        { status: 400 }
      );
    }

    const run = await saveCapturePromptAsync(runId, {
      number,
      title,
      text,
      artifact: artifact || '',
      observation: observation || ''
    });

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found or not in capture state' },
        { status: 404 }
      );
    }

    return NextResponse.json(run);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save prompt' },
      { status: 500 }
    );
  }
}
