# StudyLink

StudyLink is a private student study-group coordination and academic networking app built with React, TypeScript, Vite, Express, and PostgreSQL.

## What It Does

The app supports authenticated dashboards, study groups, sessions, resources, live enrollment activity, and protected internal pages. The layout now uses a left sidebar so the app feels like a workspace instead of a public landing page.

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

The dev launcher starts the backend, starts Vite on a free port, and opens the site in your browser.

## Production

Build the frontend:

```bash
npm run build
```

Set `DATABASE_URL` for PostgreSQL and `CORS_ORIGIN` for the deployed frontend URL, then start the server with:

```bash
npm run server
```

If you want a containerized deployment, build the included Docker image:

```bash
docker build -t studylink .
docker run -p 4000:4000 -e DATABASE_URL=... -e CORS_ORIGIN=... studylink
```

The Node server will serve the built `dist/` frontend automatically when it is present.

## Project Structure

- `src/` - frontend application source
- `src/components/` - shared UI components
- `src/pages/` - page-level screens
- `backend/` - API server, auth, and database access
- `backend/db/` - migrations and seed data
- `scripts/` - development and migration scripts

## Notes

The backend includes a local JSON fallback for development when `DATABASE_URL` is not available, but PostgreSQL is expected for production deployments.
