import express from 'express';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn('⚠ NEON_DATABASE_URL not set — /api/query will return 500 until configured.');
} else {
  console.log('✓ NEON_DATABASE_URL configured');
}

function getClient() {
  if (!DATABASE_URL) throw new Error('NEON_DATABASE_URL not configured');
  return new Client({ connectionString: DATABASE_URL });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Fetch page content by type (login, admin)
app.get('/api/page', async (req, res) => {
  const { type } = req.query;
  if (!type) {
    return res.status(400).json({ error: 'Missing `type` query parameter' });
  }

  let client;
  try {
    client = getClient();
    await client.connect();
    const result = await client.query('SELECT id, type, title, content FROM pages WHERE type = $1', [type]);
    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Page type "${type}" not found` });
    }

    const page = result.rows[0];
    res.json({ success: true, page });
  } catch (err) {
    if (client) try { await client.end(); } catch {}
    console.error('Page fetch error', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Simple SQL query endpoint. POST preferred for longer queries.
app.post('/api/query', async (req, res) => {
  const { sql, params } = req.body || {};
  if (!sql) return res.status(400).json({ error: 'Missing `sql` in request body' });

  let client;
  try {
    client = getClient();
    await client.connect();
    const result = await client.query(sql, params || []);
    await client.end();
    res.json({ rows: result.rows, rowCount: result.rowCount });
  } catch (err) {
    if (client) try { await client.end(); } catch {}
    console.error('Query error', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

const port = process.env.PORT || 9999;
app.listen(port, () => {
  console.log(`Neon proxy server listening on port ${port}`);
});
