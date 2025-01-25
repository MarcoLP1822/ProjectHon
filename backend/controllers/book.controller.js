const Book = require('../models/book.model');
const path = require('path');
const fs = require('fs').promises;
const pdf = require('pdf-parse');
const { identifyStructure, createChunks, processRollingSummary } = require('../utils/chunkingUtils');

// Utility functions
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();
};

const mapBookToResponse = (book) => ({
  id: book._id,
  title: book.title,
  date: formatDate(book.uploadDate),
  metadata: book.metadata
});

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const initialMetadata = {
  categories: {
    mainCategory: null,
    secondaryCategories: []
  },
  keywords: [],
  covers: {
    scenes: [],
    selectedScene: null
  }
};

const extractTextFromFile = async (filePath, fileType) => {
  try {
    const buffer = await fs.readFile(filePath);

    if (fileType === '.pdf') {
      // Configurazione per pdf-parse per gestire i warning dei font
      const options = {
        // Ignora gli errori dei font TrueType
        fontErrors: false,
        // Opzionale: un handler personalizzato per i warning
        onWarning: (warning) => {
          if (!warning.includes('undefined function: 32')) {
            console.warn('PDF Warning:', warning);
          }
        }
      };

      const pdfData = await pdf(buffer, options);
      console.log('PDF Text extracted, length:', pdfData.text.length);
      console.log('First 100 chars:', pdfData.text.substring(0, 100));
      return pdfData.text;
    } else {
      // Per file di testo
      const text = buffer.toString('utf-8');
      console.log('Text file extracted, length:', text.length);
      console.log('First 100 chars:', text.substring(0, 100));
      return text;
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
};

exports.uploadBook = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, 'No file uploaded');
    }

    console.log('File received:', {
      path: req.file.path,
      type: path.extname(req.file.originalname).toLowerCase(),
      size: req.file.size
    });

    // Estrai il testo dal file
    const fileType = path.extname(req.file.originalname).toLowerCase();
    console.log('Attempting to extract text from:', req.file.path);

    let extractedText;
    try {
      extractedText = await extractTextFromFile(req.file.path, fileType);
      console.log('Text extraction successful:', {
        length: extractedText?.length,
        preview: extractedText?.substring(0, 100)
      });
    } catch (extractError) {
      console.error('Text extraction failed:', extractError);
      throw extractError;
    }

    // Identifica la struttura e crea i chunks
    const structure = identifyStructure(extractedText);
    const chunks = createChunks(extractedText, structure);
    
    // Genera il rolling summary durante l'upload
    const summary = await processRollingSummary(chunks);

    const book = new Book({
      title: path.parse(req.file.originalname).name,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: fileType,
      extractedText: extractedText,
      lastTextExtraction: new Date(),
      chunks: chunks,
      structure: structure,
      rollingSummary: {
        text: summary.summaryText,
        generatedAt: new Date()
      },
      metadata: initialMetadata
    });

    await book.save();

    // Log dopo il salvataggio
    console.log('Book saved with text and chunks:', {
      id: book._id,
      textLength: book.extractedText?.length,
      numChunks: book.chunks?.length,
      hasChapters: book.structure?.hasChapters
    });

    res.status(201).json({
      message: 'Book uploaded successfully',
      book: mapBookToResponse(book)
    });
  } catch (error) {
    next(error);
  }
};

exports.getBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.json(books?.length ? books.map(mapBookToResponse) : []);
  } catch (error) {
    next(error);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!id) throw createError(400, 'Book ID is required');
    if (!title?.trim()) throw createError(400, 'Book title is required');

    const book = await Book.findByIdAndUpdate(
      id,
      { title: title.trim() },
      { new: true }
    );

    if (!book) throw createError(404, 'Book not found');

    res.json({
      message: 'Book updated successfully',
      book: mapBookToResponse(book)
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw createError(400, 'Book ID is required');

    const book = await Book.findById(id);
    if (!book) throw createError(404, 'Book not found');

    if (book.filePath) {
      try {
        const fileExists = await fs.access(book.filePath)
          .then(() => true)
          .catch(() => false);
          
        if (fileExists) {
          await fs.unlink(book.filePath);
        }
      } catch (fileError) {
        console.warn(`File deletion failed for path: ${book.filePath}`, fileError);
      }
    }

    await book.deleteOne();
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.resetBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) throw createError(404, 'Book not found');

    book.metadata = initialMetadata;
    await book.save();

    res.json({
      success: true,
      book: mapBookToResponse(book)
    });
  } catch (error) {
    next(error);
  }
}; 