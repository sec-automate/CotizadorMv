const express = require('express');
const router = express.Router();
const rateController = require('../controllers/rateController');
const kommoController = require('../controllers/kommoController');

// Debug Ping
router.get('/debug-ping', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), message: 'Server is responding' });
});

// Rate Routes
router.get('/rates', rateController.getRates);
router.post('/rates', rateController.addRate);
router.put('/rates/:id', rateController.updateRate);
router.delete('/rates/:id', rateController.deleteRate);

// Lead Routes
router.get('/lead/:id', kommoController.getLead);

// Extern Quote API
const quoteController = require('../controllers/quoteController');
router.get('/quote', quoteController.calculateQuote); // Soporta query params ?adults=2&rateId=1
router.post('/quote', quoteController.calculateQuote); // Soporta body JSON

module.exports = router;
