const mongoose = require('mongoose');
const Bisac = require('../models/bisac.model');
const fs = require('fs').promises;
require('dotenv').config();

async function importBisacCodes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Leggi il file JSON con i codici BISAC
        const rawData = await fs.readFile('path/to/bisac-codes.json', 'utf8');
        const bisacCodes = JSON.parse(rawData);
        
        // Rimuovi tutti i vecchi codici
        await Bisac.deleteMany({});
        
        // Inserisci i nuovi codici
        await Bisac.insertMany(bisacCodes);
        
        console.log('Importazione BISAC completata con successo');
    } catch (error) {
        console.error('Errore durante l\'importazione:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Esegui l'importazione
importBisacCodes(); 