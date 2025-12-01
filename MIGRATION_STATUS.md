# Pano App - Neon Database Migration Complete ✓

The app is now fully migrated to use Neon Postgres for storing login and admin page content.

## What's Running

- **Frontend**: http://localhost:5174 (Vite dev server)
- **Backend**: http://localhost:9999 (Express proxy server)
- **Database**: Neon (connected via `NEON_DATABASE_URL` from `.env`)

## Database Schema

The `pages` table contains:

```
id (SERIAL PRIMARY KEY)
type (VARCHAR UNIQUE) - 'login' or 'admin'
title (VARCHAR) - Page title
content (TEXT) - Page content
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

Current data:
- **login**: "Login Page" - Welcome message for login
- **admin**: "Admin Panel" - Admin dashboard content

## How It Works

1. **Frontend Components**:
   - `src/components/LoginPage.tsx` → fetches from `/api/page?type=login`
   - `src/components/AdminPanel.tsx` → fetches from `/api/page?type=admin`
   - Both have fallback to `public/*.txt` files if the server is offline

2. **Backend Endpoints**:
   - `GET /api/health` - Health check
   - `GET /api/page?type=<login|admin>` - Fetch page content
   - `POST /api/query` - Execute arbitrary SQL (dev only)

3. **Database Initialization**:
   - Run `npm run migrate` to create the schema and seed data

## Testing the App

1. Open http://localhost:5174
2. Click **LOGIN** in the sidebar
3. See the login content fetched from the database
4. Enter any password to log in
5. Click **ADMIN** to view admin content from the database

## Updating Page Content

### Via API

```bash
curl -X POST http://localhost:9999/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "UPDATE pages SET content = $1 WHERE type = $2",
    "params": ["New admin content", "admin"]
  }'
```

### Via Neon Console

Go to Neon dashboard → SQL Editor and run:

```sql
UPDATE pages SET content = 'Your new content' WHERE type = 'admin';
```

## Available Commands

```bash
npm run dev      # Start frontend dev server
npm run server   # Start backend proxy server
npm run migrate  # Initialize database schema
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Production Deployment

For production, you would:

1. Deploy the frontend to Vercel/Netlify (just the `dist/` folder)
2. Deploy the Express server to Railway, Render, or similar
3. Set `NEON_DATABASE_URL` environment variable on the hosting platform
4. Update API URLs in components to point to your production server

## Environment

All sensitive variables are in `.env`:
- `NEON_DATABASE_URL` - Your Neon connection string
- Other Supabase/Google Drive credentials (existing)

**Never commit `.env` to version control!**
