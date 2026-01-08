import { NextRequest, NextResponse } from 'next/server';
import {
  getAnnotations,
  getAnnotationsForRun,
  getAnnotationForPrompt,
  saveAnnotation,
  deleteAnnotation,
  type IssueType,
  type Severity
} from '@/lib/annotations';

// GET /api/annotations?runId=xxx or /api/annotations?runId=xxx&promptNumber=1
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');
  const promptNumber = searchParams.get('promptNumber');

  if (runId && promptNumber) {
    const annotation = getAnnotationForPrompt(runId, parseInt(promptNumber, 10));
    return NextResponse.json({ annotation });
  }

  if (runId) {
    const annotations = getAnnotationsForRun(runId);
    return NextResponse.json({ annotations });
  }

  const annotations = getAnnotations();
  return NextResponse.json({ annotations });
}

// POST /api/annotations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, promptNumber, issueType, severity, note } = body;

    if (!runId || promptNumber === undefined || !issueType || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: runId, promptNumber, issueType, severity' },
        { status: 400 }
      );
    }

    const annotation = saveAnnotation({
      runId,
      promptNumber: parseInt(promptNumber, 10),
      issueType: issueType as IssueType,
      severity: severity as Severity,
      note: note || ''
    });

    return NextResponse.json({ annotation });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save annotation' },
      { status: 500 }
    );
  }
}

// DELETE /api/annotations?runId=xxx&promptNumber=1
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');
  const promptNumber = searchParams.get('promptNumber');

  if (!runId || !promptNumber) {
    return NextResponse.json(
      { error: 'Missing required params: runId, promptNumber' },
      { status: 400 }
    );
  }

  const deleted = deleteAnnotation(runId, parseInt(promptNumber, 10));

  if (deleted) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json(
      { error: 'Annotation not found' },
      { status: 404 }
    );
  }
}
