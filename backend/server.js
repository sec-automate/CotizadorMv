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

const path = require('path');

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Serve React Frontend ─────────────────────────────────────────────────────
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../build')));

// The "catchall" handler: for any request that doesn't
// match an API route, send back React's index.html file.
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Route not found' });
    }
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
