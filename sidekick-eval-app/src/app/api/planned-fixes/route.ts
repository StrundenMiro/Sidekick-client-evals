import { NextRequest, NextResponse } from 'next/server';
import {
  getPlannedFixesAsync,
  getPlannedFixByIdAsync,
  savePlannedFixAsync,
  deletePlannedFixAsync
} from '@/lib/plannedFixes';

// GET /api/planned-fixes or /api/planned-fixes?id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const fix = await getPlannedFixByIdAsync(id);
      if (!fix) {
        return NextResponse.json(
          { error: 'Planned fix not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ plannedFix: fix });
    }

    const plannedFixes = await getPlannedFixesAsync();
    return NextResponse.json({ plannedFixes });
  } catch (error) {
    console.error('Failed to fetch planned fixes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch planned fixes' },
      { status: 500 }
    );
  }
}

// POST /api/planned-fixes - create or update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, jiraTicket, owner } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const plannedFix = await savePlannedFixAsync({
      id,
      name,
      jiraTicket: jiraTicket || null,
      owner: owner || null
    });

    return NextResponse.json({ plannedFix });
  } catch (error) {
    console.error('Failed to save planned fix:', error);
    return NextResponse.json(
      { error: 'Failed to save planned fix' },
      { status: 500 }
    );
  }
}

// DELETE /api/planned-fixes?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required param: id' },
        { status: 400 }
      );
    }

    const deleted = await deletePlannedFixAsync(id);

    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Planned fix not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to delete planned fix:', error);
    return NextResponse.json(
      { error: 'Failed to delete planned fix' },
      { status: 500 }
    );
  }
}
