const path = require('path');
const fs = require('fs').promises;
const Bisac = require('../models/bisac.model');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);

class BisacService {
    constructor() {
        this.categoriesCache = null;
        this.categoriesCacheCompressed = null;
        this.lastCacheUpdate = null;
        this.CACHE_TTL = 60 * 60 * 1000; // 1 ora
    }

    async getOrganizedCategories(compressed = false) {
        try {
            if (this.isCacheValid()) {
                return compressed ? 
                    this.categoriesCacheCompressed : 
                    this.categoriesCache;
            }

            const fictionCategories = JSON.parse(
                await fs.readFile(path.join(__dirname, '../data/fiction-categories.json'), 'utf8')
            );
            const nonfictionCategories = JSON.parse(
                await fs.readFile(path.join(__dirname, '../data/nonfiction-categories.json'), 'utf8')
            );
            const juvCategories = JSON.parse(
                await fs.readFile(path.join(__dirname, '../data/juv-categories.json'), 'utf8')
            );
            
            this.categoriesCache = {
                fiction: fictionCategories,
                nonfiction: nonfictionCategories,
                juv: juvCategories,
            };

            // Pre-comprimi i dati per uso futuro
            this.categoriesCacheCompressed = await gzip(JSON.stringify(this.categoriesCache));
            this.lastCacheUpdate = Date.now();
            
            return compressed ? 
                this.categoriesCacheCompressed : 
                this.categoriesCache;
        } catch (error) {
            console.error('Errore nel caricamento delle categorie:', error);
            throw error;
        }
    }

    isCacheValid() {
        return (
            this.categoriesCache !== null &&
            this.lastCacheUpdate !== null &&
            Date.now() - this.lastCacheUpdate < this.CACHE_TTL
        );
    }

    // Metodo per forzare il refresh della cache se necessario
    async invalidateCache() {
        this.categoriesCache = null;
        this.lastCacheUpdate = null;
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