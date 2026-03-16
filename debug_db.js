const db = require('./backend/db');

async function debugData() {
    try {
        const res = await db.query('SELECT name, always_available, valid_from, valid_until FROM rates');
        console.log('--- RATES DATA ---');
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugData();
