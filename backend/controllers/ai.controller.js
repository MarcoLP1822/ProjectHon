const { generateCategories, generateKeywords, generateScenes, generateCoverImage, generateBackCover, generatePreface, generateStoreDescription, generateSynopsis } = require('../services/openai');
const Book = require('../models/book.model');
const fs = require('fs');
const pdf = require('pdf-parse');
const { ValidationError } = require('../utils/errors');
const { validators } = require('../utils/validators');
const logger = require('../utils/logger');
const errorMessages = require('../utils/errorMessages');
const { validateAndGetBook, validateBookContent, extractAndSaveText } = require('../utils/bookUtils');

/**
 * Cleans and normalizes text extracted from PDF
 * @param {string} text - Raw text extracted from PDF
 * @returns {string} Cleaned and normalized text
 */
const cleanExtractedText = (text) => {
  return text
    // Rimuove caratteri non stampabili
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // Normalizza gli spazi multipli
    .replace(/\s+/g, ' ')
    // Rimuove spazi all'inizio e alla fine
    .trim()
    // Rimuove header/footer numerici tipici dei PDF
    .replace(/^\d+\s*|\s*\d+$/gm, '')
    // Rimuove linee vuote multiple
    .replace(/\n{3,}/g, '\n\n')
    // Rimuove trattini di sillabazione
    .replace(/(\w+)-\n(\w+)/g, '$1$2')
    // Rimuove riferimenti bibliografici
    .replace(/\[\d+\]/g, '')
    // Rimuove note a piè di pagina
    .replace(/\b[Nn]ota\s+\d+\s*[:\.]/g, '')
    // Rimuove numeri di pagina isolati
    .replace(/^[\d]+$/gm, '')
    // Rimuove indici e sommari (opzionale, valuta se ti serve)
    .replace(/^(?:Indice|Sommario|Contents)[\s\S]*?\n\n/i, '')
    // Rimuove copyright e informazioni editoriali (opzionale)
    .replace(/©.*?\d{4}.*?\n/g, '');
};

/**
 * Extracts text content from a PDF buffer
 * @param {Buffer} pdfBuffer - Buffer containing PDF data
 * @throws {Error} If text extraction fails
 * @returns {Promise<string>} Extracted and cleaned text
 */
const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const data = await pdf(pdfBuffer);
    if (!data || !data.text) {
      throw new Error('Failed to extract text from PDF');
    }
    
    const cleanedText = cleanExtractedText(data.text);
    
    logger.info('Text extracted and cleaned from PDF', {
      previewLength: 200,
      preview: cleanedText.substring(0, 200)
    });
    return cleanedText;
  } catch (error) {
    logger.error('PDF text extraction failed', { error: error.message });
    throw new Error(`Error extracting text from PDF: ${error.message}`);
  }
};

/**
 * Generates categories for a book based on its content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.generateCategories = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    
    logger.info(`Generating categories for book: ${bookId}`);
    
    const book = await validateAndGetBook(bookId);
    const bookContent = await validateBookContent(book);
    
    logger.info(`Book content prepared for processing:`, {
      hasChunks: !!bookContent.chunks,
      numChunks: bookContent.chunks?.length,
      hasStructure: !!bookContent.structure
    });
    
    const categories = await generateCategories(bookContent);
    if (!validators.categories.validateResult(categories)) {
      throw new ValidationError(errorMessages.INVALID_GENERATED_DATA('categories'));
    }
    
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { $set: { 'metadata.categories': categories } },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      logger.error(`Failed to update book ${bookId} with categories`);
      throw new ValidationError(errorMessages.UPDATE_FAILED, 500);
    }

    logger.info(`Successfully generated categories for book ${bookId}`);
    res.json(categories);
  } catch (error) {
    logger.error(`Error generating categories: ${error.message}`, {
      bookId: req.params.bookId,
      error: error.stack
    });
    next(error);
  }
};

/**
 * Generates keywords for a book based on its content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.generateKeywords = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    
    logger.info(`Generating keywords for book: ${bookId}`);
    
    const book = await validateAndGetBook(bookId);
    const bookContent = await validateBookContent(book);
    
    logger.info(`Book content prepared for keywords generation:`, {
      hasChunks: !!bookContent.chunks,
      numChunks: bookContent.chunks?.length
    });
    
    const keywords = await generateKeywords(bookContent);
    if (!validators.keywords.validateResult(keywords)) {
      throw new ValidationError(errorMessages.INVALID_GENERATED_DATA('keywords'));
    }
    
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { $set: { 'metadata.keywords': keywords.keywords } },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      logger.error(`Failed to update book ${bookId} with keywords`);
      throw new ValidationError(errorMessages.UPDATE_FAILED, 500);
    }

    logger.info(`Successfully generated keywords for book ${bookId}`);
    res.json(keywords);
  } catch (error) {
    logger.error(`Error generating keywords: ${error.message}`, {
      bookId: req.params.bookId,
      error: error.stack
    });
    next(error);
  }
};

/**
 * Generates scene descriptions for book cover images
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.generateScenes = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    
    logger.info(`Generating scenes for book: ${bookId}`);
    
    const book = await validateAndGetBook(bookId);
    const bookContent = await validateBookContent(book);
    
    const scenes = await generateScenes(bookContent);
    if (!validators.scenes.validateScenes(scenes.scenes)) {
      throw new ValidationError(errorMessages.INVALID_GENERATED_DATA('scenes'));
    }
    
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { 
        $set: { 
          'metadata.covers.scenes': scenes.scenes,
          'metadata.covers.selectedScene': null
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      logger.error(`Failed to update book ${bookId} with scenes`);
      throw new ValidationError(errorMessages.UPDATE_FAILED, 500);
    }

    logger.info(`Successfully generated scenes for book ${bookId}`);
    res.json(scenes);
  } catch (error) {
    logger.error(`Error generating scenes: ${error.message}`, {
      bookId: req.params.bookId,
      error: error.stack
    });
    next(error);
  }
};

/**
 * Generates cover images based on scene descriptions
 * @param {Object} req - Express request object containing scenes in the body
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.generateCoverImages = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { scenes } = req.body;

    logger.info(`Generating cover images for book: ${bookId}`);

    if (!validators.scenes.validateScenes(scenes)) {
      throw new ValidationError(errorMessages.INVALID_GENERATED_DATA('scenes'));
    }

    const book = await validateAndGetBook(bookId);

    // Generiamo le immagini per ogni scena
    const coverPromises = scenes.map(async (scene, index) => {
      logger.info(`Generating image for scene ${index + 1}`, { 
        bookId,
        sceneTitle: scene.title 
      });
      
      const imageData = await generateCoverImage(scene.description);
      if (!imageData) {
        throw new ValidationError(`Failed to generate image for scene ${index + 1}`);
      }
      return {
        ...scene,
        imageData: Buffer.from(imageData, 'base64'),
        imageContentType: 'image/png',
        imageUrl: `data:image/png;base64,${imageData}`
      };
    });

    const covers = await Promise.all(coverPromises);

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { 
        $set: { 
          'metadata.covers.scenes': covers.map(cover => ({
            description: cover.description,
            title: cover.title,
            imageData: cover.imageData,
            imageContentType: cover.imageContentType
          }))
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      logger.error(`Failed to update book ${bookId} with cover images`);
      throw new ValidationError(errorMessages.UPDATE_FAILED, 500);
    }

    logger.info(`Successfully generated cover images for book ${bookId}`);
    res.json({ 
      covers: covers.map(cover => ({
        ...cover,
        imageData: undefined
      }))
    });
  } catch (error) {
    logger.error(`Error generating cover images: ${error.message}`, {
      bookId: req.params.bookId,
      error: error.stack
    });
    next(error);
  }
};

exports.generateBackCover = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    logger.info(`Generating back cover for book: ${bookId}`);

    const book = await validateAndGetBook(bookId);
    const bookContent = await validateBookContent(book);
    
    logger.info(`Book content prepared for back cover generation:`, {
      hasChunks: !!bookContent.chunks,
      numChunks: bookContent.chunks?.length
    });

    const backCover = await generateBackCover(bookContent);
    if (!validators.backCover.validateResult(backCover)) {
      throw new ValidationError(errorMessages.INVALID_GENERATED_DATA('back cover'));
    }

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { $set: { 'metadata.backCover': backCover.backCover } },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      logger.error(`Failed to update book ${bookId} with back cover`);
      throw new ValidationError(errorMessages.UPDATE_FAILED, 500);
    }

    logger.info(`Successfully generated back cover for book ${bookId}`);
    res.json(backCover);
  } catch (error) {
    logger.error(`Error generating back cover: ${error.message}`, {
      bookId: req.params.bookId,
      error: error.stack
    });
    next(error);
  }
};

exports.generatePreface = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    logger.info(`Generating preface for book: ${bookId}`);

    const book = await validateAndGetBook(bookId);
    const bookContent = await validateBookContent(book);
    
    logger.info(`Book content prepared for preface generation:`, {
      hasChunks: !!bookContent.chunks,
      numChunks: bookContent.chunks?.length
    });

    const preface = await generatePreface(bookContent);
    if (!validators.preface.validateResult(preface)) {
      throw new ValidationError(errorMessages.INVALID_GENERATED_DATA('preface'));
    }

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { $set: { 'metadata.preface': preface.preface } },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      logger.error(`Failed to update book ${bookId} with preface`);
      throw new ValidationError(errorMessages.UPDATE_FAILED, 500);
    }

    logger.info(`Successfully generated preface for book ${bookId}`);
    res.json(preface);
  } catch (error) {
    logger.error(`Error generating preface: ${error.message}`, {
      bookId: req.params.bookId,
      error: error.stack
    });
    next(error);
  }
};

exports.generateStoreDescription = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    logger.info(`Generating store description for book: ${bookId}`);

    const book = await validateAndGetBook(bookId);
    const bookContent = await validateBookContent(book);
    
    logger.info(`Book content prepared for store description generation:`, {
      hasChunks: !!bookContent.chunks,
      numChunks: bookContent.chunks?.length
    });

    const storeDescription = await generateStoreDescription(bookContent);
    if (!validators.storeDescription.validateResult(storeDescription)) {
      throw new ValidationError(errorMessages.INVALID_GENERATED_DATA('store description'));
    }

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { $set: { 'metadata.storeDescription': storeDescription.storeDescription } },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      logger.error(`Failed to update book ${bookId} with store description`);
      throw new ValidationError(errorMessages.UPDATE_FAILED, 500);
    }

    logger.info(`Successfully generated store description for book ${bookId}`);
    res.json(storeDescription);
  } catch (error) {
    logger.error(`Error generating store description: ${error.message}`, {
      bookId: req.params.bookId,
      error: error.stack
    });
    next(error);
  }
};

exports.generateSynopsis = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    logger.info(`Generating synopsis for book: ${bookId}`);

    const book = await validateAndGetBook(bookId);
    const bookContent = await validateBookContent(book);
    
    logger.info(`Book content prepared for synopsis generation:`, {
      hasChunks: !!bookContent.chunks,
      numChunks: bookContent.chunks?.length
    });

    const synopsis = await generateSynopsis(bookContent);
    if (!validators.synopsis.validateResult(synopsis)) {
      throw new ValidationError(errorMessages.INVALID_GENERATED_DATA('synopsis'));
    }

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { $set: { 'metadata.synopsis': synopsis.synopsis } },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      logger.error(`Failed to update book ${bookId} with synopsis`);
      throw new ValidationError(errorMessages.UPDATE_FAILED, 500);
    }

    logger.info(`Successfully generated synopsis for book ${bookId}`);
    res.json(synopsis);
  } catch (error) {
    logger.error(`Error generating synopsis: ${error.message}`, {
      bookId: req.params.bookId,
      error: error.stack
    });
    next(error);
  }
}; 