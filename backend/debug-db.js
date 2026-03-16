const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

console.log('--- Database Debugging Module ---');
console.log('Current Environment Variables:');
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_PORT:', process.env.DB_PORT);
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '********' : 'MISSING');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT (hidden)' : 'MISSING');
console.log('- DB_SSL:', process.env.DB_SSL);

const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

console.log('\nCalculated Pool Config:');
console.log(JSON.stringify({
    ...poolConfig,
    password: poolConfig.password ? '********' : undefined,
    connectionString: poolConfig.connectionString ? 'PRESENT' : undefined
}, null, 2));

const pool = new Pool(poolConfig);

async function debugConnection() {
    console.log('\nAttempting to connect...');
    try {
        const client = await pool.connect();
        console.log('✅ SUCCESS: Physical connection established.');
        
        const res = await client.query('SELECT current_database(), current_user, version()');
        console.log('✅ SUCCESS: Query executed.');
        console.log('Database Info:', res.rows[0]);
        
        client.release();
        await pool.end();
        console.log('\nDebug complete: Connection is working correctly.');
    } catch (err) {
        console.error('\n❌ FAILURE: Connection error detected.');
        console.error('Error Name:', err.name);
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        
        if (err.code === 'ECONNREFUSED') {
            console.log('\nTIP: Verify the DB_HOST and DB_PORT. Is the database running?');
        } else if (err.code === '28P01') {
            console.log('\nTIP: Password authentication failed. Check DB_USER and DB_PASSWORD.');
        } else if (err.code === '3D000') {
            console.log('\nTIP: Database does not exist. Check DB_NAME.');
        } else if (err.message.includes('SSL')) {
            console.log('\nTIP: SSL issues detected. Try setting DB_SSL=true or DB_SSL=false.');
        }
    }
}

debugConnection();
