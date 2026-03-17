import pg from 'npm:pg';
import { config } from 'npm:dotenv';
const { Pool } = pg;
config({ path: 'backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function verify() {
  try {
    const res = await pool.query('SELECT id, name, created_at, always_available, adult_price_1 FROM rates ORDER BY created_at DESC LIMIT 5');
    console.log('Last 5 rates:');
    console.table(res.rows);
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

verify();
