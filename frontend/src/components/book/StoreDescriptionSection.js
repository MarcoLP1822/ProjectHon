import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { useBooks } from '../../context/BookContext';
import { useParams, useNavigate } from 'react-router-dom';

const StoreDescriptionSection = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Prende l'ID del libro dall'URL
  const { books, generateStoreDescription, updateBookMetadata } = useBooks();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Trova il libro corrente usando l'ID dall'URL
  const currentBook = books.find(book => book.id === id);

  React.useEffect(() => {
    if (!currentBook) {
      navigate('/');
    }
  }, [currentBook, navigate]);

  const handleGenerate = async () => {
    try {
      setError(null);
      setIsGenerating(true);
      
      const result = await generateStoreDescription(currentBook.id);
      
      await updateBookMetadata(currentBook.id, {
        storeDescription: result.storeDescription
      });
      
      setSuccess(true);
    } catch (error) {
      setError('Errore nella generazione della descrizione per gli store. Riprova.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  if (!currentBook) return null;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Descrizione Store
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
        {currentBook?.metadata?.storeDescription ? (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {currentBook.metadata.storeDescription}
          </Typography>
        ) : (
          <Typography color="text.secondary">
            Nessuna descrizione generata. Clicca il pulsante per generarne una.
          </Typography>
        )}
      </Paper>

      <Button
        variant="contained"
        onClick={handleGenerate}
        disabled={isGenerating}
        startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
        sx={{
          minWidth: '200px',
          height: '48px'
        }}
      >
        {isGenerating ? 'Generazione...' : 'Genera Descrizione'}
      </Button>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Descrizione per gli store generata con successo!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StoreDescriptionSection; 