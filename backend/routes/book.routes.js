const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { upload, cleanupTempFiles, getDirectoryStatus } = require('../services/fileStorage');
const aiController = require('../controllers/ai.controller');

router.post('/upload', upload.single('book'), bookController.uploadBook);
router.get('/', bookController.getBooks);
router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);
router.post('/:id/reset', bookController.resetBook);

// Nuove routes per la gestione dei file temporanei
router.post('/cleanup', async (req, res, next) => {
  try {
    const force = req.query.force === 'true';
    const result = await cleanupTempFiles(force);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/storage-status', async (req, res, next) => {
  try {
    const status = await getDirectoryStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

router.post('/:bookId/keywords', aiController.generateKeywords);

module.exports = router; 