import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dbDir = path.resolve(rootDir, 'backend', 'db');
const migrationDir = path.resolve(dbDir, 'migrations');
const seedDir = path.resolve(dbDir, 'seeds');
const databaseUrl = process.env.DATABASE_URL;
const shouldSeed = process.argv.includes('--seed');

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Set it to your PostgreSQL connection string and try again.');
  process.exit(1);
}

function runPsql(args) {
  const result = spawnSync('psql', ['--dbname', databaseUrl, ...args], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      console.error('psql was not found. Install PostgreSQL client tools or add psql to PATH.');
      process.exit(1);
    }

    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getSortedSqlFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.toLowerCase().endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));
}

function ensureMigrationTable() {
  runPsql([
    '--command',
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
  ]);
}

function getAppliedMigrations() {
  const result = spawnSync(
    'psql',
    ['--dbname', databaseUrl, '--tuples-only', '--no-align', '--command', 'SELECT filename FROM schema_migrations ORDER BY filename;'],
    {
      cwd: rootDir,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    return new Set();
  }

  return new Set(
    String(result.stdout || '')
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function applyFile(filePath) {
  runPsql(['--file', filePath]);
}

function recordMigration(filename) {
  const escapedFilename = filename.replace(/'/g, "''");
  runPsql(['--command', `INSERT INTO schema_migrations (filename) VALUES ('${escapedFilename}') ON CONFLICT (filename) DO NOTHING;`]);
}

function runMigrations() {
  ensureMigrationTable();
  const appliedMigrations = getAppliedMigrations();
  const files = getSortedSqlFiles(migrationDir);

  for (const file of files) {
    if (appliedMigrations.has(file)) {
      continue;
    }

    const fullPath = path.resolve(migrationDir, file);
    console.log(`Applying migration: ${file}`);
    applyFile(fullPath);
    recordMigration(file);
  }
}

function runSeeds() {
  const files = getSortedSqlFiles(seedDir);

  for (const file of files) {
    const fullPath = path.resolve(seedDir, file);
    console.log(`Applying seed: ${file}`);
    applyFile(fullPath);
  }
}

runMigrations();

if (shouldSeed) {
  runSeeds();
}

console.log('Database migration workflow completed successfully.');