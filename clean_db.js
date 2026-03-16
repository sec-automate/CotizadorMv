const db = require('./backend/db');

async function cleanData() {
    try {
        await db.query('DELETE FROM rates');
        console.log('All rates deleted successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanData();
