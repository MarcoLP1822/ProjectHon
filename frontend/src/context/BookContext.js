import { useState, useEffect, createContext, useContext } from 'react';
import { bookService } from '../services/api';

const BookContext = createContext();

export const BookProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnyTaskGenerating, setIsAnyTaskGenerating] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await bookService.getBooks();
      setBooks(data || []);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setBooks([]);
        return;
      }
      console.error('Error loading books:', error);
    }
  };

  const addBook = async (bookData) => {
    try {
      setIsUploading(true);
      const response = await bookService.uploadBook(bookData.file);
      setBooks(prevBooks => [...prevBooks, response.book]);
      return response.book.id;
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const removeBook = async (bookId) => {
    try {
      await bookService.deleteBook(bookId);
      setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
    } catch (error) {
      console.error('Error removing book:', error);
      throw error;
    }
  };

  const updateBook = async (bookId, updatedBook) => {
    try {
      const response = await bookService.updateBook(bookId, updatedBook);
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === bookId ? response.book : book
        )
      );
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  };

  const generateCategories = async (bookId) => {
    try {
      console.log('BookContext: Starting generateCategories for bookId:', bookId);
      setIsGenerating(true);
      const response = await bookService.generateCategories(bookId);
      console.log('BookContext: Received categories response:', response);
      
      // Aggiorniamo anche lo stato globale dei libri
      setBooks(prevBooks => prevBooks.map(book => 
        book.id === bookId 
          ? { ...book, metadata: { ...book.metadata, categories: response } }
          : book
      ));
      
      return response;
    } catch (error) {
      console.error('BookContext: Error generating categories:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateKeywords = async (bookId) => {
    try {
      setIsGenerating(true);
      const response = await bookService.generateKeywords(bookId);
      return response;
    } catch (error) {
      console.error('Error generating keywords:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateScenes = async (bookId) => {
    try {
      console.log('BookContext: Starting generateScenes for bookId:', bookId);
      setIsGenerating(true);
      const response = await bookService.generateScenes(bookId);
      console.log('BookContext: Received response from generateScenes:', response);
      return response;
    } catch (error) {
      console.error('BookContext: Error in generateScenes:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCoverImages = async (bookId, scenes) => {
    try {
      setIsGenerating(true);
      const response = await bookService.generateCoverImages(bookId, scenes);
      return response;
    } catch (error) {
      console.error('Error generating cover images:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const resetBookData = async (bookId) => {
    try {
      await bookService.resetBookData(bookId);
      setBooks(prevBooks => {
        return prevBooks.map(book => {
          if (book.id === bookId) {
            return {
              ...book,
              metadata: {
                categories: null,
                keywords: null,
                covers: null,
                backCover: null,
                preface: null,
                storeDescription: null
              }
            };
          }
          return book;
        });
      });
    } catch (error) {
      console.error('Error resetting book data:', error);
      throw error;
    }
  };

  const generateBackCover = async (bookId) => {
    try {
      console.log('BookContext: Starting generateBackCover for bookId:', bookId);
      setIsGenerating(true);
      const response = await bookService.generateBackCover(bookId);
      console.log('BookContext: Received back cover response:', response);
      
      // Aggiorniamo lo stato globale preservando tutti i metadata esistenti
      setBooks(prevBooks => prevBooks.map(book => {
        if (book.id === bookId) {
          return {
            ...book,
            metadata: {
              ...book.metadata,  // Preserviamo tutti i metadata esistenti
              categories: book.metadata.categories,  // Preserviamo esplicitamente le categorie
              keywords: book.metadata.keywords,      // Preserviamo esplicitamente le keywords
              covers: book.metadata.covers,          // Preserviamo esplicitamente le covers
              backCover: response.backCover          // Aggiungiamo la quarta
            }
          };
        }
        return book;
      }));
      
      return response;
    } catch (error) {
      console.error('BookContext: Error generating back cover:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePreface = async (bookId) => {
    try {
      console.log('BookContext: Starting generatePreface for bookId:', bookId);
      setIsGenerating(true);
      const response = await bookService.generatePreface(bookId);
      console.log('BookContext: Received preface response:', response);
      
      // Aggiorniamo lo stato globale dei libri
      setBooks(prevBooks => prevBooks.map(book => {
        if (book.id === bookId) {
          return {
            ...book,
            metadata: {
              ...book.metadata,
              categories: book.metadata.categories,  // Preserviamo le categorie
              keywords: book.metadata.keywords,      // Preserviamo le keywords
              covers: book.metadata.covers,          // Preserviamo le covers
              backCover: book.metadata.backCover,    // Preserviamo la quarta
              preface: response.preface             // Aggiungiamo la prefazione
            }
          };
        }
        return book;
      }));
      
      return response;
    } catch (error) {
      console.error('BookContext: Error generating preface:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStoreDescription = async (bookId) => {
    try {
      console.log('BookContext: Starting generateStoreDescription for bookId:', bookId);
      console.log('BookContext: Current books state:', books);
      setIsGenerating(true);
      
      const response = await bookService.generateStoreDescription(bookId);
      console.log('BookContext: Received store description response:', response);
      
      // Aggiorniamo lo stato globale dei libri
      setBooks(prevBooks => {
        const updatedBooks = prevBooks.map(book => {
          if (book.id === bookId) {
            const updatedBook = {
              ...book,
              metadata: {
                ...book.metadata,
                categories: book.metadata.categories,
                keywords: book.metadata.keywords,
                covers: book.metadata.covers,
                backCover: book.metadata.backCover,
                preface: book.metadata.preface,
                storeDescription: response.storeDescription
              }
            };
            console.log('BookContext: Updated book:', updatedBook);
            return updatedBook;
          }
          return book;
        });
        console.log('BookContext: Updated books state:', updatedBooks);
        return updatedBooks;
      });
      
      return response;
    } catch (error) {
      console.error('BookContext: Error generating store description:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const updateBookMetadata = (bookId, updates) => {
    setBooks(prevBooks => {
      return prevBooks.map(book => {
        if (book.id === bookId) {
          return {
            ...book,
            metadata: {
              ...book.metadata,  // Preserva i metadata esistenti
              ...updates        // Aggiunge/aggiorna solo i campi specificati
            }
          };
        }
        return book;
      });
    });
  };

  const generateSynopsis = async (bookId) => {
    try {
      const result = await bookService.generateSynopsis(bookId);
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === bookId 
            ? { ...book, metadata: { ...book.metadata, synopsis: result.synopsis } }
            : book
        )
      );
      return result;
    } catch (error) {
      console.error('Error generating synopsis:', error);
      throw error;
    }
  };

  const value = {
    books, 
    setBooks, 
    addBook, 
    removeBook, 
    updateBook,
    isUploading,
    isGenerating,
    generateCategories,
    generateKeywords,
    generateScenes,
    generateCoverImages,
    resetBookData,
    generateBackCover,
    generatePreface,
    generateStoreDescription,
    updateBookMetadata,
    isAnyTaskGenerating,
    setIsAnyTaskGenerating,
    generateSynopsis,
  };

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => useContext(BookContext); 