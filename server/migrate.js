import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlFile = path.join(__dirname, 'init-db.sql');

async function initDb() {
  const client = new Client({ connectionString: process.env.NEON_DATABASE_URL });
  
  try {
    console.log('Connecting to Neon...');
    await client.connect();
    console.log('✓ Connected');

    const sql = fs.readFileSync(sqlFile, 'utf-8');
    
    console.log('Running migration...');
    await client.query(sql);
    console.log('✓ Migration complete');

    // Verify the table was created
    const result = await client.query('SELECT * FROM pages ORDER BY id');
    console.log(`✓ Table "pages" contains ${result.rows.length} rows:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.type}: "${row.title}"`);
    });
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDb();
