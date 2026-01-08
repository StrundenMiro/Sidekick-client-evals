import { NextRequest, NextResponse } from 'next/server';
import { startCaptureAsync } from '@/lib/runs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, testType = 'ai-generated-iteration' } = body;

    if (!format) {
      return NextResponse.json(
        { error: 'Format is required' },
        { status: 400 }
      );
    }

    const run = await startCaptureAsync(format, testType);
    return NextResponse.json(run);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start capture' },
      { status: 500 }
    );
  }
}
