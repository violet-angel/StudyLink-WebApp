#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dbDir = path.resolve(rootDir, 'backend', 'db');
const migrationDir = path.resolve(dbDir, 'migrations');
const seedDir = path.resolve(dbDir, 'seeds');

const args = process.argv.slice(2);
const shouldSeed = args.includes('--seed');
const databaseUrl = process.env.DATABASE_URL || (args.find((a) => a.startsWith('--db=')) || '').replace('--db=', '');

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Provide it via env or --db=postgres://...');
  process.exit(1);
}

function getSqlFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((f) => f.toLowerCase().endsWith('.sql')).sort((a, b) => a.localeCompare(b));
}

async function run() {
  // Enable SSL for hosted providers (Render, Heroku). For local dev this is harmless.
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Ensure migration table
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`);

  const appliedRes = await client.query('SELECT filename FROM schema_migrations;');
  const applied = new Set(appliedRes.rows.map((r) => r.filename));

  const migrations = getSqlFiles(migrationDir);
  for (const file of migrations) {
    if (applied.has(file)) continue;
    const full = path.join(migrationDir, file);
    console.log('Applying migration:', file);
    const sql = fs.readFileSync(full, 'utf8');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING;', [file]);
    } catch (err) {
      console.error('Failed to apply migration', file, err.message || err);
      await client.end();
      process.exit(1);
    }
  }

  if (shouldSeed) {
    const seeds = getSqlFiles(seedDir);
    for (const file of seeds) {
      const full = path.join(seedDir, file);
      console.log('Applying seed:', file);
      const sql = fs.readFileSync(full, 'utf8');
      try {
        await client.query(sql);
      } catch (err) {
        console.error('Failed to apply seed', file, err.message || err);
        await client.end();
        process.exit(1);
      }
    }
  }

  await client.end();
  console.log('Migrations completed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
