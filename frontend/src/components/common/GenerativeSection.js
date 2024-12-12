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

const GenerativeSection = ({
  title,
  emptyMessage,
  generateButtonText,
  onGenerate,
  renderContent,
  successMessage
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { books } = useBooks();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
      await onGenerate(currentBook.id);
      setSuccess(true);
    } catch (error) {
      setError(`Errore nella generazione ${title.toLowerCase()}. Riprova.`);
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
        {title}
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
        {renderContent(currentBook) || (
          <Typography color="text.secondary">
            {emptyMessage}
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
        {isGenerating ? 'Generazione...' : generateButtonText}
      </Button>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage || `${title} generata con successo!`}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GenerativeSection; 