const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/debug-ping', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), message: 'Server is responding' });
});

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Get all rates
app.get('/api/rates', async (req, res) => {
    console.log('API Request: GET /api/rates');
    try {
        const result = await db.query('SELECT * FROM rates ORDER BY created_at DESC');
        console.log(`API Success: Found ${result.rows.length} rates`);
        res.json(result.rows);
    } catch (err) {
        console.error('API Error details:', {
            message: err.message,
            code: err.code,
            stack: err.stack.split('\n')[0]
        });
        res.status(500).json({ error: err.message, code: err.code });
    }
});

// Add a new rate
app.post('/api/rates', async (req, res) => {
    console.log('--- POST /api/rates ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));

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
        console.log('Success: Rate saved');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Database Error in POST:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update a rate
app.put('/api/rates/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`--- PUT /api/rates/${id} ---`);
    console.log('Body:', JSON.stringify(req.body, null, 2));

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
        console.log('Success: Rate updated');
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Database Error in PUT:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a rate
app.delete('/api/rates/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM rates WHERE id = $1', [id]);
        res.json({ message: 'Rate deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Kommo CRM Lead Integration ───────────────────────────────────────────────
const KOMMO_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjIyYjQ2NmUwYjMwNmMxNzJkZTJjZmI0OTNmNzgzYjc3YWY4NzhhNTI3Nzk3YjMxNzEzYTRmZjNkMTI4Yjc5YTM5OTY1NzQzNzQyMTdjNjM0In0.eyJhdWQiOiI3ZmNkZDY3Ny1hNTRiLTQzMzQtYjYwZC00MmFhYTYzOTIwYWEiLCJqdGkiOiIyMmI0NjZlMGIzMDZjMTcyZGUyY2ZiNDkzZjc4M2I3N2FmODc4YTUyNzc5N2IzMTcxM2E0ZmYzZDEyOGI3OWEzOTk2NTc0Mzc0MjE3YzYzNCIsImlhdCI6MTc3MzQxMTU2MywibmJmIjoxNzczNDExNTYzLCJleHAiOjE4OTM0NTYwMDAsInN1YiI6IjEyNzgwOTI3IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0MjI4MTI3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiY2UzMTlhMjgtOGE3NC00NGM3LThkMDgtMjBjM2VjMzMyZGNiIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.Q6t-rCM1k8gOV8Pty_SZK5nu1uEBTGJ9nrgjxLm2keb_Mi6uvzilwPhr4mPqrWSLl1X7V9xtiZA-IuwGCXecwQ4FpwKtX69swQ5B_nH-hz0YjPSdOi_KxZnvSXnrrUb0FhK7sSxDae1qOcX6rK0ktJW9EbQ4MYEFp3QqJk8abHBz-L8VVexabKpIP-LauoObI7tWJ2stLeotpkVm60I_1UdndCs4oXiYdwCBe0h8_irq6yh3C2AnunPePLHeVoy-mmF-h2ZdqzcqYKP8La4jwFYJaL2O3JIrlYdyrTpsF9ONQy3EL4TEgq06QFPVW8g0yICegcAMMM0umlmFCqQFxg';
const KOMMO_BASE = 'https://crmmargaritavillage.kommo.com/api/v4';

// Kommo custom field IDs
const FIELD_MAP = {
    ENTRADA: 888863,
    SALIDA: 888911,
    ADULTOS: 888869,
    NINOS: 888867,
    MASCOTAS: 888873,
    TELEFONO: 888875,
};

const getField = (fields, id) => {
    const f = (fields || []).find(f => f.field_id === id);
    return f ? f.values[0]?.value : null;
};

const tsToDate = (ts) => {
    if (!ts) return '';
    const d = new Date(Number(ts) * 1000);
    return d.toISOString().split('T')[0];
};

app.get('/api/lead/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await fetch(`${KOMMO_BASE}/leads/${id}`, {
            headers: {
                'accept': 'application/json',
                'authorization': `Bearer ${KOMMO_TOKEN}`
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Kommo API error: ${response.status}` });
        }

        const lead = await response.json();
        const cf = lead.custom_fields_values || [];

        // Parse lead name: "Noe Rodriguez-18404150" → "Noe Rodriguez"
        const customerName = (lead.name || '').replace(/-\d+$/, '').trim();

        const result = {
            leadId: lead.id,
            customerName,
            customerPhone: getField(cf, FIELD_MAP.TELEFONO) || '',
            adults: parseInt(getField(cf, FIELD_MAP.ADULTOS)) || 1,
            children: parseInt(getField(cf, FIELD_MAP.NINOS)) || 0,
            pets: parseInt(getField(cf, FIELD_MAP.MASCOTAS)) || 0,
            checkIn: tsToDate(getField(cf, FIELD_MAP.ENTRADA)),
            checkOut: tsToDate(getField(cf, FIELD_MAP.SALIDA)),
        };

        console.log(`Lead ${id} loaded:`, result);
        res.json(result);
    } catch (err) {
        console.error('Error fetching Kommo lead:', err.message);
        res.status(500).json({ error: err.message });
    }
});
// ── Catch-all JSON 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});
// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
