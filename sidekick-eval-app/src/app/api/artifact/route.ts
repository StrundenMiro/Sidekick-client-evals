import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

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

    // Check if Cloudinary is configured (CLOUDINARY_URL is auto-detected by the SDK)
    if (!process.env.CLOUDINARY_URL) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Set CLOUDINARY_URL environment variable.' },
        { status: 500 }
      );
    }

    // Ensure we have a proper data URL for Cloudinary
    let dataUrl = imageData;
    if (!imageData.startsWith('data:')) {
      dataUrl = `data:image/${format};base64,${imageData}`;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: `sidekick-eval/${runId}`,
      public_id: `v${promptNumber}`,
      format: format,
      overwrite: true,
    });

    return NextResponse.json({
      success: true,
      path: result.secure_url
    });
  } catch (error) {
    console.error('Error uploading artifact to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to upload artifact' },
      { status: 500 }
    );
  }
}
