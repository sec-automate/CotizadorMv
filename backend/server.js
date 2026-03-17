const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors()); // In production, you might want to restrict this to your domain
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Catch-all JSON 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
