import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useBooks } from '../../context/BookContext';
import { useParams, useNavigate } from 'react-router-dom';

const GenerativeSection = ({
  title,
  emptyMessage,
  generateButtonText,
  onGenerate,
  renderContent,
  successMessage,
  contentType
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { books } = useBooks();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const handleCopyContent = (book) => {
    let textToCopy = '';
    
    switch (contentType) {
      case 'keywords':
        textToCopy = book?.metadata?.keywords?.keywords?.join('\n') || '';
        break;
      case 'synopsis':
        textToCopy = book?.metadata?.synopsis || '';
        break;
      case 'backCover':
        textToCopy = book?.metadata?.backCover || '';
        break;
      case 'preface':
        textToCopy = book?.metadata?.preface || '';
        break;
      default:
        textToCopy = '';
    }

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
  };

  const hasContent = (book) => {
    switch (contentType) {
      case 'keywords':
        return !!book?.metadata?.keywords?.keywords?.length;
      case 'synopsis':
        return !!book?.metadata?.synopsis;
      case 'backCover':
        return !!book?.metadata?.backCover;
      case 'preface':
        return !!book?.metadata?.preface;
      default:
        return false;
    }
  };

  if (!currentBook) return null;

  return (
    <Box sx={{ p: 10 }}>
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

      <Stack direction="row" spacing={2} alignItems="center">
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

        {hasContent(currentBook) && (
          <Button
            variant="contained"
            color="inherit"
            onClick={() => handleCopyContent(currentBook)}
            startIcon={<ContentCopyIcon />}
            sx={{
              minWidth: '200px',
              height: '48px',
              backgroundColor: 'white',
              color: 'text.primary',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Copia Contenuto
          </Button>
        )}
      </Stack>

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

      <Snackbar open={copySuccess} autoHideDuration={2000} onClose={() => setCopySuccess(false)}>
        <Alert onClose={() => setCopySuccess(false)} severity="success" sx={{ width: '100%' }}>
          Contenuto copiato negli appunti
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GenerativeSection; 