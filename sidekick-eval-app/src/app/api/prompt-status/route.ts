import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const { runId, promptNumber, status } = await request.json();

    if (!runId || promptNumber === undefined || !status) {
      return NextResponse.json(
        { error: 'runId, promptNumber, and status are required' },
        { status: 400 }
      );
    }

    if (!['pass', 'fail', 'warning'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be pass, fail, or warning' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE prompts SET status = $1 WHERE run_id = $2 AND number = $3`,
      [status, runId, promptNumber]
    );

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Failed to update prompt status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
