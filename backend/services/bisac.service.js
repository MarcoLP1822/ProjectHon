const path = require('path');
const fs = require('fs').promises;
const Bisac = require('../models/bisac.model');

class BisacService {
    async getOrganizedCategories() {
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
            const artCategories = JSON.parse(
                await fs.readFile(path.join(__dirname, '../data/art-categories.json'), 'utf8')
            );  
            const varieCategories = JSON.parse(
                await fs.readFile(path.join(__dirname, '../data/varie.json'), 'utf8')
            );  
            
            return {
                fiction: fictionCategories,
                humanities: humanitiesCategories,
                selfhelp: selfhelpCategories,
                juv: juvCategories,
                art: artCategories,
                varie: varieCategories
            };
        } catch (error) {
            console.error('Errore nel caricamento delle categorie:', error);
            throw error;
        }
    }

    async searchBisacCodes(searchQuery) {
        try {
            // Ricerca full-text nei titoli e descrizioni
            const results = await Bisac.find(
                { $text: { $search: searchQuery } },
                { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .limit(10);
            
            return results;
        } catch (error) {
            console.error('Errore nella ricerca BISAC:', error);
            throw error;
        }
    }

    async getBisacByCode(code) {
        try {
            return await Bisac.findOne({ code });
        } catch (error) {
            console.error('Errore nel recupero BISAC:', error);
            throw error;
        }
    }
}

module.exports = new BisacService(); 