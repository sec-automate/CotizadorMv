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

exports.getLead = async (req, res) => {
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

        res.json(result);
    } catch (err) {
        console.error('Error fetching Kommo lead:', err.message);
        res.status(500).json({ error: err.message });
    }
};
