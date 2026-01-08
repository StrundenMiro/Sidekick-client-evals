#!/usr/bin/env npx ts-node --compiler-options '{"module":"CommonJS"}'

/**
 * CLI script to save a run to the database (or JSON fallback)
 * Usage: npx ts-node scripts/save-run.ts '{"id": "...", "format": "...", ...}'
 *
 * This script reads the DATABASE_URL from .env.local and saves directly,
 * so it works both locally and on Replit without hardcoding URLs.
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

import { saveRunAsync, type Run } from '../src/lib/runs';

async function main() {
  const jsonArg = process.argv[2];

  if (!jsonArg) {
    console.error('Usage: npx ts-node scripts/save-run.ts \'{"id": "...", ...}\'');
    console.error('Or pipe JSON: echo \'{"id": "..."}\' | npx ts-node scripts/save-run.ts -');
    process.exit(1);
  }

  // Warn if DATABASE_URL is not set
  if (!process.env.DATABASE_URL) {
    console.error('\n⚠️  WARNING: DATABASE_URL is not set!');
    console.error('   Data will be saved to local JSON file only.');
    console.error('   This will NOT sync with Replit or other environments.');
    console.error('   To fix: Add DATABASE_URL to .env.local\n');
    console.error('Continue anyway? Saving to JSON in 3 seconds... (Ctrl+C to abort)');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  let runData: Run;

  try {
    if (jsonArg === '-') {
      // Read from stdin
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      runData = JSON.parse(Buffer.concat(chunks).toString());
    } else {
      runData = JSON.parse(jsonArg);
    }
  } catch (e) {
    console.error('Invalid JSON:', e);
    process.exit(1);
  }

  if (!runData.id || !runData.format || !runData.timestamp) {
    console.error('Run must have id, format, and timestamp');
    process.exit(1);
  }

  try {
    await saveRunAsync(runData);
    if (process.env.DATABASE_URL) {
      console.log(`✅ Saved run: ${runData.id}`);
      console.log(`   Storage: PostgreSQL (synced)`);
    } else {
      console.log(`⚠️  Saved run: ${runData.id}`);
      console.log(`   Storage: Local JSON only (NOT synced)`);
    }
  } catch (e) {
    console.error('❌ Failed to save run:', e);
    process.exit(1);
  }
}

main();
