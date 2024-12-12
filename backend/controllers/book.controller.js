const Book = require('../models/book.model');
const path = require('path');
const fs = require('fs').promises;
const pdf = require('pdf-parse');

// Utility functions
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', { 
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
      const pdfData = await pdf(buffer);
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

    const book = new Book({
      title: path.parse(req.file.originalname).name,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: fileType,
      extractedText: extractedText,
      lastTextExtraction: new Date(),
      metadata: initialMetadata
    });

    await book.save();
    
    // Log dopo il salvataggio
    console.log('Book saved with text:', {
      id: book._id,
      textLength: book.extractedText?.length,
      textPreview: book.extractedText?.substring(0, 100)
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
    if (!books?.length) {
      throw createError(404, 'No books found');
    }

    res.json(books.map(mapBookToResponse));
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

    try {
      await fs.unlink(book.filePath);
    } catch (fileError) {
      console.warn(`File deletion failed for path: ${book.filePath}`, fileError);
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