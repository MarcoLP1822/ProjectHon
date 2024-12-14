const { ValidationError } = require('./errors');
const { validators } = require('./validators');
const Book = require('../models/book.model');
const fs = require('fs').promises;
const { identifyStructure, createChunks, processRollingSummary } = require('./chunkingUtils');
const { convertToTxt } = require('./fileConverter');

const cleanExtractedText = (text) => {
  // Log del testo originale per debug
  console.log('Original text encoding:', Buffer.from(text).toString('hex').substring(0, 100));
  
  // Prima pulizia: rimuovi tutti i caratteri non stampabili e di controllo
  let cleaned = text
    // Normalizza gli spazi bianchi
    .replace(/[\f\r\t\v]/g, ' ')
    // Rimuovi caratteri di controllo mantenendo newline
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Converti eventuali sequenze di numeri e virgole in spazi
    .replace(/(?<!\w)[\d,]+(?!\w)/g, ' ')
    // Rimuovi caratteri speciali mantenendo solo lettere, numeri e punteggiatura base
    .replace(/[^\p{L}\p{N}\p{P}\s]/gu, ' ')
    // Rimuovi spazi multipli
    .replace(/\s+/g, ' ')
    // Rimuovi linee vuote multiple ma mantieni la struttura del paragrafo
    .replace(/(\n\s*){3,}/g, '\n\n')
    .trim();

  // Log del testo pulito per debug
  console.log('Cleaned text sample:', cleaned.substring(0, 200));
  
  // Verifica che il testo pulito contenga effettivamente del testo leggibile
  if (!/[a-zA-Z]{2,}/g.test(cleaned)) {
    console.warn('Warning: Cleaned text does not contain readable content, attempting aggressive cleaning...');
    cleaned = text
      // Converti i caratteri Unicode in ASCII
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      // Mantieni solo caratteri ASCII base e newline
      .replace(/[^\x20-\x7E\n]/g, ' ')
      // Pulisci gli spazi
      .replace(/\s+/g, ' ')
      .trim();
      
    if (!/[a-zA-Z]{2,}/g.test(cleaned)) {
      console.error('Error: Text is still unreadable after aggressive cleaning');
      throw new Error('Failed to extract readable text from document');
    }
  }

  return cleaned;
};

const extractAndSaveText = async (filePath, bookId) => {
    try {
        const book = await Book.findById(bookId);
        if (!book) {
            throw new Error(`Book with id ${bookId} not found`);
        }

        const conversionResult = await convertToTxt(filePath);
        
        if (!conversionResult.success) {
            throw new Error(`Failed to extract text: ${conversionResult.error}`);
        }

        const cleanedText = cleanExtractedText(conversionResult.text);

        console.log('Text Extraction Stats:', {
            originalLength: conversionResult.text.length,
            cleanedLength: cleanedText.length,
            preview: cleanedText.substring(0, 200)
        });

        const structure = identifyStructure(cleanedText);
        const chunks = createChunks(cleanedText, structure);
        
        // Debug log
        console.log('Created chunks structure:', {
            numChunks: chunks.length,
            firstChunkType: typeof chunks[0],
            firstChunkKeys: chunks[0] ? Object.keys(chunks[0]) : [],
            hasText: chunks[0]?.text !== undefined
        });
        
        // Se non riusciamo a creare chunks dal testo principale, proviamo il fallback
        if (!chunks || chunks.length === 0) {
            console.warn('No chunks created from primary text, attempting fallback...');
            
            // Fallback ai metadati se il chunking principale fallisce
            const textContent = [
                book?.title || '',
                book?.subtitle || '',
                book?.description || '',
                book?.preface || '',
                book?.backCover || '',
                book?.keywords?.join(' ') || ''
            ].join('\n');

            if (!textContent.trim()) {
                throw new Error('No text content available from either source');
            }

            // Creiamo chunks dal fallback
            structure = identifyStructure(textContent);
            chunks = createChunks(textContent, structure);
            
            if (!chunks || chunks.length === 0) {
                throw new Error('Failed to create chunks from fallback text');
            }

            return {
                fullText: textContent,
                chunks: chunks,
                structure: structure,
                usedFallback: true
            };
        }
        
        return {
            fullText: cleanedText,
            chunks: chunks,
            structure: structure,
            usedFallback: false
        };

    } catch (error) {
        console.error('Error in extractAndSaveText:', error);
        throw error;
    }
};

const validateBookContent = async (book) => {
    if (!book) {
        throw new Error('Book data is required');
    }

    // Verifichiamo che abbiamo un filePath valido
    if (!book.filePath) {
        throw new Error('Book file path is required');
    }

    const content = await extractAndSaveText(book.filePath, book._id);
    
    if (!content.fullText || content.fullText.trim().length === 0) {
        throw new Error('Book content is empty or invalid');
    }

    if (!content.chunks || content.chunks.length === 0) {
        throw new Error('Failed to create chunks from book content');
    }

    return content;
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