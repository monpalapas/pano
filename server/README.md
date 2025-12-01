# Local Neon proxy server

This tiny server provides a single endpoint `/api/query` to run SQL queries against your Neon (Postgres) database using the `pg` driver.

Environment

- `NEON_DATABASE_URL` — your Neon connection string (recommended) or `DATABASE_URL`.

Run

```bash
# from project root
npm install
npm run server
```

Example request

```bash
curl -X POST http://localhost:9999/api/query -H "Content-Type: application/json" \
  -d '{"sql": "SELECT NOW()"}'
```
