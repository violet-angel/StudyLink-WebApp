#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const curatedPath = path.resolve(root, 'backend', 'curated_links.json');

const databaseUrl = process.env.DATABASE_URL || (process.argv.find((a) => a.startsWith('--db=')) || '').replace('--db=', '');
if (!databaseUrl) {
  console.error('Provide DATABASE_URL via env or --db=postgres://...');
  process.exit(1);
}

async function run() {
  if (!fs.existsSync(curatedPath)) {
    console.error('No curated_links.json found at', curatedPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(curatedPath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse curated_links.json', err.message || err);
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    for (const [courseCode, links] of Object.entries(parsed)) {
      if (!Array.isArray(links)) continue;
      for (const item of links) {
        const label = item.label || item.title || null;
        const url = item.url || null;
        const type = item.type || null;
        const source = item.source || null;
        const addedAt = item.addedAt ? new Date(item.addedAt) : null;
        const addedBy = item.addedBy || item.added_by || null;
        const metadata = { ...item };
        delete metadata.label; delete metadata.url; delete metadata.type; delete metadata.source; delete metadata.addedAt; delete metadata.addedBy;

        await client.query(
          `INSERT INTO curated_links (course_code, label, url, type, source, added_at, added_by, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT DO NOTHING;`,
          [courseCode, label, url, type, source, addedAt, addedBy, metadata]
        );
      }
    }
    console.log('Import completed.');
  } catch (err) {
    console.error('Import error', err.message || err);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
