const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const bisacService = require('../services/bisac.service');

// Route per ottenere le categorie dai file JSON
router.get('/categories', async (req, res) => {
    try {
        const fictionCategories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/fiction-categories.json'), 'utf8')
        );
        const humanitiesCategories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/humanities-categories.json'), 'utf8')
        );
        const selfhelpCategories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/selfhelp-categories.json'), 'utf8')
        );
        const juvCategories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/juv-categories.json'), 'utf8')
        );
        const stemCategories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/stem-categories.json'), 'utf8')
        );
        const religionCategories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/religion-categories.json'), 'utf8')
        );
        const artCategories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/art-categories.json'), 'utf8')
        );  
        const svagoCategories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/svago-categories.json'), 'utf8')
        );
        const varieCategories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/varie.json'), 'utf8')
        );

        res.json({
            fiction: fictionCategories,
            humanities: humanitiesCategories,
            selfhelp: selfhelpCategories,
            juv: juvCategories,
            stem: stemCategories,
            religion: religionCategories,
            art: artCategories,
            svago: svagoCategories,
            varie: varieCategories
        });
    } catch (error) {
        console.error('Errore nel recupero delle categorie:', error);
        res.status(500).json({ error: error.message });
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