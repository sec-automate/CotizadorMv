const db = require('../db');
const { calculateTotal, parsePrice } = require('../utils/pricing');

exports.calculateQuote = async (req, res) => {
    try {
        // Permitir que los parámetros vengan por GET (?query) o POST (body)
        const params = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;
        
        const { 
            rateId, 
            adults = 1, 
            children = 0, 
            pets = 0, 
            rooms = '', 
            checkIn = '', 
            checkOut = '' 
        } = params;

        if (!rateId) {
            return res.status(400).json({ error: 'rateId es requerido.' });
        }

        // Obtener la tarifa desde la BD
        const result = await db.query('SELECT * FROM rates WHERE id = $1', [rateId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarifa no encontrada.' });
        }
        const rate = result.rows[0];

        // Calcular los días transcurridos
        let days = 1;
        if (checkIn && checkOut) {
            const start = new Date(checkIn);
            const end = new Date(checkOut);
            if (end > start) {
                const diffTime = Math.abs(end - start);
                days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        // Ejecutar el motor de precios matemático
        const quoteResult = calculateTotal(
            rate, 
            { 
                adults: parseInt(adults), 
                children: parseInt(children), 
                pets: parseInt(pets), 
                rooms: rooms ? parseInt(rooms) : ''
            }, 
            days
        );

        if (quoteResult.error) {
            return res.status(400).json({ error: quoteResult.error });
        }

        // Construir el enlace directo para que el navegador genere automáticamente el PDF de esta cita.
        const protocol = req.protocol;
        const host = req.get('host');
        // Usamos una ruta /quote que programaremos en el front para auto-renderizar.
        const pdfLink = `${protocol}://${host}/?rateId=${rateId}&adults=${adults}&children=${children}&pets=${pets}&rooms=${rooms}&checkIn=${checkIn}&checkOut=${checkOut}&autoPdf=true`;

        res.json({
            success: true,
            data: {
                rateInfo: {
                    name: rate.name,
                    room_type: rate.room_type,
                    plan_type: rate.plan_type
                },
                nights: days,
                ...quoteResult // Devuelve { total, roomDetails }
            },
            pdf_link: pdfLink
        });

    } catch (error) {
        console.error('API Error in calculateQuote:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'Error interno calculando la cotización.', details: error.message });
    }
};
