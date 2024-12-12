module.exports = {
  INVALID_BOOK_ID: 'Invalid book ID format',
  BOOK_NOT_FOUND: 'Book not found',
  INVALID_CONTENT: 'Invalid or empty book content',
  EXTRACTION_FAILED: 'Failed to extract text from PDF',
  UPDATE_FAILED: 'Failed to update book',
  INVALID_GENERATED_DATA: (type) => `Generated ${type} is invalid or incomplete`
}; 