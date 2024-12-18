const express = require('express');
const router = express.Router();
const bisacService = require('../services/bisac.service');

// Route per ottenere le categorie dai file JSON
router.get('/categories', async (req, res) => {
    try {
        // Verifica se il client accetta gzip
        const acceptsGzip = req.headers['accept-encoding']?.includes('gzip');
        
        const categories = await bisacService.getOrganizedCategories(acceptsGzip);
        
        if (acceptsGzip) {
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Type', 'application/json');
            res.send(categories);
        } else {
            res.json(categories);
        }
    } catch (error) {
        console.error('Errore nel recupero delle categorie:', error);
        res.status(500).json({ 
            error: 'Errore nel recupero delle categorie',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route esistente per la ricerca
router.get('/search', async (req, res) => {
    try {
        const results = await bisacService.searchBisacCodes(req.query.q);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 