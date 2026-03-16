const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Create tables if they don't exist
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        adult_price DECIMAL(10, 2) NOT NULL,
        child_price DECIMAL(10, 2) NOT NULL,
        pet_price DECIMAL(10, 2) DEFAULT 0,
        max_adults INTEGER DEFAULT 10,
        max_children INTEGER DEFAULT 10,
        max_pets INTEGER DEFAULT 5,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Run ALTERs separately to ensure they apply
    const columns = [
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS max_adults INTEGER DEFAULT 10',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS max_children INTEGER DEFAULT 10',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS max_pets INTEGER DEFAULT 5',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS valid_from DATE',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS valid_until DATE',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS always_available BOOLEAN DEFAULT true',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS adult_price_1 DECIMAL(10, 2) DEFAULT 0',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS adult_price_2 DECIMAL(10, 2) DEFAULT 0',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS adult_price_3 DECIMAL(10, 2) DEFAULT 0',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS adult_price_4 DECIMAL(10, 2) DEFAULT 0',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS max_people_per_room INTEGER DEFAULT 4',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS free_children_count INTEGER DEFAULT 0',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS room_type VARCHAR(50) DEFAULT \'estandar\'',
      'ALTER TABLE rates ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT \'AI\'',
      'ALTER TABLE rates ALTER COLUMN adult_price DROP NOT NULL',
      'ALTER TABLE rates ALTER COLUMN child_price DROP NOT NULL'
    ];

    for (const sql of columns) {
      await pool.query(sql);
    }

    // Ensure no NULLs in boolean columns
    await pool.query('UPDATE rates SET always_available = true WHERE always_available IS NULL');
    await pool.query('UPDATE rates SET is_active = true WHERE is_active IS NULL');

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database', err);
  }
};

initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
