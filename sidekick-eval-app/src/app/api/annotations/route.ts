import { NextRequest, NextResponse } from 'next/server';
import {
  getAnnotationsAsync,
  getAnnotationsForRunAsync,
  getAnnotationsForPromptAsync,
  saveAnnotationAsync,
  deleteAnnotationAsync,
  deleteAnnotationByIdAsync,
  type IssueType,
  type Severity,
  type AnnotationTarget
} from '@/lib/annotations';

// GET /api/annotations?runId=xxx or /api/annotations?runId=xxx&promptNumber=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const promptNumber = searchParams.get('promptNumber');

    if (runId && promptNumber) {
      // Return array of annotations for this prompt
      const annotations = await getAnnotationsForPromptAsync(runId, parseInt(promptNumber, 10));
      return NextResponse.json({ annotations });
    }

    if (runId) {
      const annotations = await getAnnotationsForRunAsync(runId);
      return NextResponse.json({ annotations });
    }

    const annotations = await getAnnotationsAsync();
    return NextResponse.json({ annotations });
  } catch (error) {
    console.error('Failed to fetch annotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
}

// POST /api/annotations - create new or update existing (if id provided)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, runId, messageId, promptNumber, author, issueType, severity, note, plannedFixId, owner, target } = body;

    // Accept either messageId or promptNumber (for backward compat)
    const resolvedMessageId = messageId ?? promptNumber;

    if (!runId || resolvedMessageId === undefined || !issueType || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: runId, messageId (or promptNumber), issueType, severity' },
        { status: 400 }
      );
    }

    // Build target object if provided (simplified)
    let annotationTarget: AnnotationTarget | undefined;
    if (target) {
      if (target.type === 'image' && target.x !== undefined && target.y !== undefined) {
        annotationTarget = {
          type: 'image',
          marker: {
            x: target.x,
            y: target.y,
            ...(target.label ? { label: target.label } : {})
          }
        };
      } else if (target.type === 'message') {
        annotationTarget = { type: 'message' };
      } else {
        // Default to message-level annotation
        annotationTarget = { type: 'message' };
      }
    }

    const annotation = await saveAnnotationAsync({
      id, // Optional - if provided, updates existing
      runId,
      messageId: parseInt(String(resolvedMessageId), 10),
      promptNumber: parseInt(String(promptNumber ?? resolvedMessageId), 10), // Legacy compat
      author: (author || 'human') as 'frank' | 'human',
      issueType: issueType as IssueType,
      severity: severity as Severity,
      note: note || '',
      plannedFixId: plannedFixId || null,
      owner: owner || null,
      ...(annotationTarget ? { target: annotationTarget } : { target: { type: 'message' } })
    });

    return NextResponse.json({ annotation });
  } catch (error) {
    console.error('Failed to save annotation:', error);
    return NextResponse.json(
      { error: 'Failed to save annotation' },
      { status: 500 }
    );
  }
}

// DELETE /api/annotations?id=xxx or /api/annotations?runId=xxx&promptNumber=1
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const annotationId = searchParams.get('id');
    const runId = searchParams.get('runId');
    const promptNumber = searchParams.get('promptNumber');

    let deleted = false;

    if (annotationId) {
      // Delete by ID
      deleted = await deleteAnnotationByIdAsync(annotationId);
    } else if (runId && promptNumber) {
      // Delete all for prompt (legacy)
      deleted = await deleteAnnotationAsync(runId, parseInt(promptNumber, 10));
    } else {
      return NextResponse.json(
        { error: 'Missing required params: id or (runId and promptNumber)' },
        { status: 400 }
      );
    }

    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to delete annotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
