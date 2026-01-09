import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { getRunsAsync, saveRunAsync, Run } from '../src/lib/runs';

const ARTIFACTS_DIR = path.join(process.cwd(), 'public', 'artifacts');

async function migrateImages() {
  // Check Cloudinary config
  if (!process.env.CLOUDINARY_URL) {
    console.error('CLOUDINARY_URL not set');
    process.exit(1);
  }

  console.log('Loading runs from database...');
  const runs = await getRunsAsync();
  console.log(`Found ${runs.length} runs`);

  let uploadCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const run of runs) {
    let updated = false;

    for (const prompt of run.prompts) {
      if (!prompt.artifact) continue;

      // Skip if already a Cloudinary URL
      if (prompt.artifact.startsWith('http')) {
        skipCount++;
        continue;
      }

      // Build local file path
      const localPath = path.join(process.cwd(), 'public', prompt.artifact);

      if (!fs.existsSync(localPath)) {
        console.warn(`File not found: ${localPath}`);
        errorCount++;
        continue;
      }

      try {
        // Extract run ID and filename for Cloudinary path
        const parts = prompt.artifact.split('/');
        const runId = parts[1]; // artifacts/{runId}/{filename}
        const filename = parts[2];
        const publicId = filename.replace(/\.[^.]+$/, ''); // Remove extension

        console.log(`Uploading: ${prompt.artifact}`);

        const result = await cloudinary.uploader.upload(localPath, {
          folder: `sidekick-eval/${runId}`,
          public_id: publicId,
          overwrite: true,
        });

        prompt.artifact = result.secure_url;
        updated = true;
        uploadCount++;

        console.log(`  → ${result.secure_url}`);
      } catch (err) {
        console.error(`Failed to upload ${prompt.artifact}:`, err);
        errorCount++;
      }
    }

    if (updated) {
      await saveRunAsync(run as Run);
      console.log(`Updated run: ${run.id}`);
    }
  }

  console.log('\n--- Migration Complete ---');
  console.log(`Uploaded: ${uploadCount}`);
  console.log(`Skipped (already on Cloudinary): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
}

migrateImages().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
