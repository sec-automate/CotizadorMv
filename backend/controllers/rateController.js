const db = require('../db');

// Get all rates
exports.getRates = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM rates ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('API Error details:', {
            message: err.message,
            code: err.code,
            stack: err.stack.split('\n')[0]
        });
        res.status(500).json({ error: err.message, code: err.code });
    }
};

// Add a new rate
exports.addRate = async (req, res) => {
    const {
        name, adult_price_1, adult_price_2, adult_price_3, adult_price_4,
        child_price, pet_price,
        max_people_per_room, max_pets, free_children_count,
        valid_from, valid_until, always_available,
        room_type, plan_type
    } = req.body;

    // Force boolean conversion
    const always_available_bool = String(always_available) === 'true';

    try {
        const result = await db.query(
            `INSERT INTO rates (
                name, adult_price_1, adult_price_2, adult_price_3, adult_price_4,
                child_price, pet_price, 
                max_people_per_room, max_pets, free_children_count,
                valid_from, valid_until, always_available,
                room_type, plan_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
            [
                name, adult_price_1, adult_price_2, adult_price_3, adult_price_4,
                child_price, pet_price,
                max_people_per_room || 4, max_pets || 0, free_children_count || 0,
                valid_from || null, valid_until || null,
                always_available_bool,
                room_type || 'estandar', plan_type || 'AI'
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Database Error in POST:', {
            message: err.message,
            code: err.code,
            detail: err.detail
        });
        res.status(500).json({ 
            error: err.message, 
            code: err.code,
            detail: err.detail
        });
    }
};

// Update a rate
exports.updateRate = async (req, res) => {
    const { id } = req.params;
    const {
        name, adult_price_1, adult_price_2, adult_price_3, adult_price_4,
        child_price, pet_price,
        max_people_per_room, max_pets, free_children_count,
        valid_from, valid_until, always_available, is_active,
        room_type, plan_type
    } = req.body;

    // Force boolean conversion
    const always_available_bool = String(always_available) === 'true';
    const is_active_bool = String(is_active) === 'true';

    try {
        const result = await db.query(
            `UPDATE rates SET 
                name = $1, adult_price_1 = $2, adult_price_2 = $3, adult_price_3 = $4, adult_price_4 = $5,
                child_price = $6, pet_price = $7, 
                max_people_per_room = $8, max_pets = $9, free_children_count = $10,
                valid_from = $11, valid_until = $12, always_available = $13, 
                is_active = $14, room_type = $15, plan_type = $16 
            WHERE id = $17 RETURNING *`,
            [
                name, adult_price_1, adult_price_2, adult_price_3, adult_price_4,
                child_price, pet_price,
                max_people_per_room || 4, max_pets || 0, free_children_count || 0,
                valid_from || null, valid_until || null,
                always_available_bool, is_active_bool,
                room_type || 'estandar', plan_type || 'AI', id
            ]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Rate not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Database Error in PUT:', {
            message: err.message,
            code: err.code,
            detail: err.detail
        });
        res.status(500).json({ 
            error: err.message, 
            code: err.code,
            detail: err.detail
        });
    }
};

// Delete a rate
exports.deleteRate = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM rates WHERE id = $1', [id]);
        res.json({ message: 'Rate deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
