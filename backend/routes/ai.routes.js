const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Middleware per verificare l'esistenza del bookId
const validateBookId = (req, res, next) => {
    const bookId = req.params.bookId;
    if (!bookId) {
        return res.status(400).json({ error: 'Book ID is required' });
    }
    next();
};

// Applicare il middleware di validazione a tutte le rotte
router.use('/:bookId', validateBookId);

// Raggruppare le rotte correlate
router.post('/categories/:bookId', aiController.generateCategories);
router.post('/keywords/:bookId', aiController.generateKeywords);
router.post('/scenes/:bookId', aiController.generateScenes);

// Rotte relative alle immagini
router.post('/covers/:bookId', aiController.generateCoverImages);
router.post('/backcover/:bookId', aiController.generateBackCover);

// Rotte relative ai contenuti testuali
router.post('/preface/:bookId', aiController.generatePreface);
router.post('/store-description/:bookId', aiController.generateStoreDescription);
router.post('/synopsis/:bookId', aiController.generateSynopsis);

module.exports = router; 