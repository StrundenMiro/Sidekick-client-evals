import { NextRequest, NextResponse } from 'next/server';
import { saveRunAsync, getRunsAsync, deleteRunAsync, type Run } from '@/lib/runs';

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

// DELETE a run by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteRunAsync(id);
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to delete run:', error);
    return NextResponse.json(
      { error: 'Failed to delete run' },
      { status: 500 }
    );
  }
}
