const { generateCategories, generateKeywords, generateScenes, generateCoverImage, generateBackCover, generatePreface, generateStoreDescription, generateSynopsis } = require('../services/openai');
const Book = require('../models/book.model');
const fs = require('fs');
const pdf = require('pdf-parse');
const { ValidationError } = require('../utils/errors');
const { validators } = require('../utils/validators');
const logger = require('../utils/logger');
const errorMessages = require('../utils/errorMessages');
const { validateAndGetBook, validateBookContent } = require('../utils/bookUtils');
const openaiService = require('../services/openai');

/**
 * Generates categories for a book based on its content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.generateCategories = async (req, res, next) => {
  const bookId = req.params.bookId;
  
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    if (!book.rollingSummary?.text) {
      throw new Error('Book has no rolling summary. Please re-upload the book.');
    }

    const result = await openaiService.generateCategories({
      chunks: book.chunks,
      rollingSummary: book.rollingSummary
    });

    book.metadata.categories = result;
    await book.save();

    res.json(result);
  } catch (error) {
    logger.error('Error generating categories:', {
      bookId,
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
  const bookId = req.params.bookId;
  
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    if (!book.rollingSummary?.text) {
      throw new Error('Book has no rolling summary. Please re-upload the book.');
    }

    const result = await openaiService.generateKeywords({
      chunks: book.chunks,
      rollingSummary: book.rollingSummary
    });

    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId },
      { 
        'metadata.keywords': result.keywords 
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!updatedBook) {
      throw new Error('Failed to update book keywords');
    }

    res.json(result);
  } catch (error) {
    logger.error('Error generating keywords:', {
      bookId,
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
  const bookId = req.params.bookId;
  
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    if (!book.rollingSummary?.text) {
      throw new Error('Book has no rolling summary. Please re-upload the book.');
    }

    const result = await openaiService.generateScenes({
      chunks: book.chunks,
      rollingSummary: book.rollingSummary
    });

    book.metadata.covers.scenes = result.scenes;
    book.metadata.covers.selectedScene = null;
    await book.save();

    res.json(result);
  } catch (error) {
    logger.error('Error generating scenes:', {
      bookId,
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
  const bookId = req.params.bookId;
  
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    if (!book.rollingSummary?.text) {
      throw new Error('Book has no rolling summary. Please re-upload the book.');
    }

    const result = await openaiService.generateBackCover({
      chunks: book.chunks,
      rollingSummary: book.rollingSummary
    });

    book.metadata.backCover = result.backCover;
    await book.save();

    res.json(result);
  } catch (error) {
    logger.error('Error generating back cover:', {
      bookId,
      error: error.stack
    });
    next(error);
  }
};

exports.generatePreface = async (req, res, next) => {
  const bookId = req.params.bookId;
  
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    if (!book.rollingSummary?.text) {
      throw new Error('Book has no rolling summary. Please re-upload the book.');
    }

    const result = await openaiService.generatePreface({
      chunks: book.chunks,
      rollingSummary: book.rollingSummary
    });

    book.metadata.preface = result.preface;
    await book.save();

    res.json(result);
  } catch (error) {
    logger.error('Error generating preface:', {
      bookId,
      error: error.stack
    });
    next(error);
  }
};

exports.generateStoreDescription = async (req, res, next) => {
  const bookId = req.params.bookId;
  
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    if (!book.rollingSummary?.text) {
      throw new Error('Book has no rolling summary. Please re-upload the book.');
    }

    const result = await openaiService.generateStoreDescription({
      chunks: book.chunks,
      rollingSummary: book.rollingSummary
    });

    book.metadata.storeDescription = result.storeDescription;
    await book.save();

    res.json(result);
  } catch (error) {
    logger.error('Error generating store description:', {
      bookId,
      error: error.stack
    });
    next(error);
  }
};

exports.generateSynopsis = async (req, res, next) => {
  const bookId = req.params.bookId;
  
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    if (!book.rollingSummary?.text) {
      throw new Error('Book has no rolling summary. Please re-upload the book.');
    }

    const result = await openaiService.generateSynopsis({
      chunks: book.chunks,
      rollingSummary: book.rollingSummary
    });

    book.metadata.synopsis = result.synopsis;
    await book.save();

    res.json(result);
  } catch (error) {
    logger.error('Error generating synopsis:', {
      bookId,
      error: error.stack
    });
    next(error);
  }
};

const upload = async (req, res) => {
  try {
    // ... codice esistente
  } catch (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'LIMIT_FILE_SIZE',
        message: 'Il file è troppo grande. La dimensione massima consentita è 10MB.'
      });
    }
    
    return res.status(500).json({
      message: 'Si è verificato un errore durante il caricamento del file'
    });
  }
}; 