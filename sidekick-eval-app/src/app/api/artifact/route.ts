import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, promptNumber, imageData, format = 'png' } = body;

    if (!runId || promptNumber === undefined || !imageData) {
      return NextResponse.json(
        { error: 'runId, promptNumber, and imageData are required' },
        { status: 400 }
      );
    }

    // Create directory for artifacts
    const artifactsDir = path.join(process.cwd(), 'public', 'artifacts', runId);
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    // Remove data URL prefix if present
    let base64Data = imageData;
    if (imageData.includes(',')) {
      base64Data = imageData.split(',')[1];
    }

    // Save the image
    const filename = `v${promptNumber}.${format}`;
    const filepath = path.join(artifactsDir, filename);
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));

    // Return the relative path for use in the run data
    const relativePath = `artifacts/${runId}/${filename}`;

    return NextResponse.json({
      success: true,
      path: relativePath
    });
  } catch (error) {
    console.error('Error saving artifact:', error);
    return NextResponse.json(
      { error: 'Failed to save artifact' },
      { status: 500 }
    );
  }
}
