const { ValidationError } = require('./errors');
const { validators } = require('./validators');
const Book = require('../models/book.model');
const fs = require('fs').promises;
const pdf = require('pdf-parse');

const extractAndSaveText = (book) => {
    if (!book) {
        throw new Error('Book data is required');
    }

    console.log('Book data in extractAndSaveText:', {
        hasExtractedText: !!book.extractedText,
        extractedTextLength: book.extractedText?.length,
        title: book.title
    });

    // Usa il testo estratto dal PDF se disponibile
    if (book.extractedText) {
        return book.extractedText;
    }

    // Fallback ai metadati se il testo estratto non è disponibile
    const textContent = [
        book.title || '',
        book.subtitle || '',
        book.description || '',
        book.preface || '',
        book.backCover || '',
        book.keywords?.join(' ') || ''
    ].join('\n');

    return textContent;
};

const validateBookContent = async (book) => {
    if (!book) {
        throw new Error('Book data is required');
    }

    const textContent = await extractAndSaveText(book);
    
    if (!textContent || textContent.trim().length === 0) {
        throw new Error('Book content is empty or invalid');
    }

    return textContent;
};

/**
 * Validates a book ID and retrieves the corresponding book from the database
 * @param {string} bookId - The MongoDB ID of the book to validate and retrieve
 * @throws {ValidationError} If the book ID is invalid or the book is not found
 * @returns {Promise<Object>} The book document from MongoDB
 */
async function validateAndGetBook(bookId) {
  if (!validators.isValidObjectId(bookId)) {
    throw new ValidationError('Invalid book ID format');
  }

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ValidationError('Book not found', 404);
  }

  return book;
}

module.exports = {
  validateAndGetBook,
  validateBookContent,
  extractAndSaveText
}; 