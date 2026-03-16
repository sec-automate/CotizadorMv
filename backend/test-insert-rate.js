const { Pool } = require('pg');

const connectionString = 'postgres://postgres:123456mv@161.97.116.1:5433/margaritavillage?sslmode=disable';

const pool = new Pool({
  connectionString: connectionString,
});

async function testInsert() {
  console.log('--- Database Insertion Test ---');
  try {
    const testName = 'Test Promo Antigravity ' + new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    console.log(`Attempting to insert rate: "${testName}"...`);
    
    const insertSql = `
      INSERT INTO rates (
        name, adult_price_1, adult_price_2, adult_price_3, adult_price_4,
        child_price, pet_price, 
        max_people_per_room, max_pets, free_children_count,
        valid_from, valid_until, always_available,
        room_type, plan_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING id, name, created_at
    `;

    const values = [
      testName, 100, 180, 250, 320, // adult prices
      50, 20, // child, pet
      4, 2, 1, // max per room, max pets, free children
      null, null, true, // validity
      'estandar', 'AI' // types
    ];

    const res = await pool.query(insertSql, values);
    console.log('✅ SUCCESS: Rate inserted with ID:', res.rows[0].id);
    console.log('Data returned:', res.rows[0]);

    console.log('\nVerifying by listing last 5 rates...');
    const listRes = await pool.query('SELECT id, name, created_at FROM rates ORDER BY created_at DESC LIMIT 5');
    console.table(listRes.rows);

    await pool.end();
    console.log('\nTest complete.');
  } catch (err) {
    console.error('\n❌ FAILURE: Insertion failed.');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  }
}

testInsert();
