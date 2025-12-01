# Neon Database Migration Guide

This app now fetches login and admin page content from a Neon Postgres database.

## Prerequisites

- A Neon account and database
- Node.js and npm installed locally
- `NEON_DATABASE_URL` environment variable set

## Setup Steps

### 1. Create Neon Database and Get Connection String

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project and database
3. Copy the connection string (looks like `postgres://user:password@host/dbname?sslmode=require`)

### 2. Initialize Database Schema

Run the SQL migration to create the `pages` table with seed data:

```bash
# Option A: Using psql (if installed)
psql $NEON_DATABASE_URL < server/init-db.sql

# Option B: Using the API endpoint
npm run server &
curl -X POST http://localhost:9999/api/query \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "sql": "$(cat server/init-db.sql)"
}
EOF
```

### 3. Set Environment Variable

Create a `.env` file in the project root:

```bash
NEON_DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
```

Or export in your shell:

```bash
export NEON_DATABASE_URL="postgres://user:password@host/dbname?sslmode=require"
```

### 4. Install Dependencies and Run

```bash
npm install
npm run server
```

In another terminal:

```bash
npm run dev
```

### 5. Verify It Works

1. Open the app in your browser (http://localhost:5174)
2. Click **LOGIN** in the sidebar — it should fetch content from the database
3. Enter any password to log in
4. Click **ADMIN** — it should display admin content from the database

## Updating Page Content

### From Command Line

Update the login page:

```bash
npm run server &
curl -X POST http://localhost:9999/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "UPDATE pages SET content = $1 WHERE type = $2",
    "params": ["New login content here", "login"]
  }'
```

### Directly in Neon Console

1. Open the Neon console
2. Run SQL:
   ```sql
   UPDATE pages SET content = 'Your new admin content' WHERE type = 'admin';
   ```

## API Endpoints

- `GET /api/health` — health check
- `GET /api/page?type=<login|admin>` — fetch page by type
- `POST /api/query` — run arbitrary SQL (dev only)

## Fallback Behavior

If the server is offline or the database is unreachable, the app will fall back to reading from `public/login.txt` and `public/admin.txt`.

## Troubleshooting

- **Connection error**: Check that `NEON_DATABASE_URL` is set and valid
- **404 on /api/page**: Run the migration script (`server/init-db.sql`) to create and seed the table
- **CORS errors**: The server allows all origins; if still blocked, check browser console
