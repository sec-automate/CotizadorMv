const db = require('./backend/db');

async function testInsert() {
    try {
        console.log('Inserting rate with always_available = false and specific dates...');
        const result = await db.query(
            'INSERT INTO rates (name, adult_price, child_price, pet_price, max_adults, max_children, max_pets, valid_from, valid_until, always_available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            ['Test Rate', 100, 50, 20, 10, 10, 5, '2026-03-12', '2026-03-19', false]
        );
        console.log('Inserted Rate:', result.rows[0]);

        const check = await db.query('SELECT name, always_available, valid_from, valid_until FROM rates WHERE name = $1', ['Test Rate']);
        console.log('Database Check:', check.rows[0]);

        process.exit(0);
    } catch (err) {
        console.error('Error during test insert:', err);
        process.exit(1);
    }
}

testInsert();
