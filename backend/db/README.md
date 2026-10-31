# Database Setup

This folder contains the production database foundation for StudyLink.

## Contents

- `migrations/` holds ordered SQL migrations.
- `seeds/` holds repeatable seed data for local development.

## Requirements

- PostgreSQL
- `psql` available on your PATH
- `DATABASE_URL` set in your environment

## Commands

```bash
npm run db:migrate
npm run db:seed
```

## Notes

- Migrations are tracked in the `schema_migrations` table.
- Seed files are written to be repeatable so they can be re-applied safely in development.
- The application backend still uses the demo JSON store in the current phase. Phase 2 will swap the API handlers over to these tables.