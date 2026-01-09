#!/usr/bin/env npx ts-node --compiler-options '{"module":"CommonJS"}'

/**
 * CLI script to save an annotation directly to the database
 * Usage: npx ts-node scripts/save-annotation.ts '{"runId": "...", "promptNumber": 1, "author": "frank", ...}'
 *
 * This script reads the DATABASE_URL from .env.local and saves directly,
 * bypassing the HTTP API for reliability.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

interface Annotation {
  runId: string;
  promptNumber: number;
  author: string;
  issueType: string;
  severity: 'good' | 'low' | 'medium' | 'high';
  note: string;
}

async function saveAnnotation(annotation: Annotation): Promise<string> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Cannot save annotation.');
  }

  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO annotations (id, run_id, prompt_number, author, issue_type, severity, note) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, annotation.runId, annotation.promptNumber, annotation.author, annotation.issueType, annotation.severity, annotation.note]
    );
    return id;
  } finally {
    await pool.end();
  }
}

async function main() {
  const jsonArg = process.argv[2];

  if (!jsonArg) {
    console.error('Usage: npx ts-node scripts/save-annotation.ts \'{"runId": "...", "promptNumber": 1, ...}\'');
    console.error('\nRequired fields:');
    console.error('  runId: string - ID of the run this annotation belongs to');
    console.error('  promptNumber: number - Which prompt (0, 1, 2, etc.)');
    console.error('  author: string - Who wrote this (e.g., "frank")');
    console.error('  issueType: string - Type of issue (e.g., "other", "truncation")');
    console.error('  severity: "good" | "low" | "medium" | "high"');
    console.error('  note: string - The annotation text');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERROR: DATABASE_URL is not set!');
    console.error('   Annotations require a database connection.');
    console.error('   Add DATABASE_URL to .env.local');
    process.exit(1);
  }

  let annotation: Annotation;

  try {
    annotation = JSON.parse(jsonArg);
  } catch (e) {
    console.error('Invalid JSON:', e);
    process.exit(1);
  }

  // Validate required fields
  const required = ['runId', 'promptNumber', 'author', 'issueType', 'severity', 'note'];
  const missing = required.filter(f => !(f in annotation));
  if (missing.length > 0) {
    console.error(`Missing required fields: ${missing.join(', ')}`);
    process.exit(1);
  }

  try {
    const id = await saveAnnotation(annotation);
    console.log(`✅ Saved annotation: ${id}`);
    console.log(`   Run: ${annotation.runId}`);
    console.log(`   Prompt: ${annotation.promptNumber}`);
    console.log(`   Severity: ${annotation.severity}`);
  } catch (e) {
    console.error('❌ Failed to save annotation:', e);
    process.exit(1);
  }
}

main();
