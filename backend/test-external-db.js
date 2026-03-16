const { Pool } = require('pg');

const connectionString = 'postgres://postgres:123456mv@161.97.116.1:5433/margaritavillage?sslmode=disable';

console.log('--- External Database Connection Test ---');
console.log('Connection URI:', connectionString.replace(/:[^:]+@/, ':********@'));

const pool = new Pool({
  connectionString: connectionString,
});

async function testConnection() {
  console.log('\nAttempting to connect...');
  try {
    const client = await pool.connect();
    console.log('✅ SUCCESS: Connection established.');
    
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log('✅ SUCCESS: Query executed.');
    console.log('Database Info:', res.rows[0]);
    
    client.release();
    await pool.end();
    console.log('\nTest complete.');
  } catch (err) {
    console.error('\n❌ FAILURE: Connection failed.');
    console.error('Error Message:', err.message);
    process.exit(1);
  }
}

testConnection();
