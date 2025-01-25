import React from 'react';
import {
  Box,
  Button,
  IconButton,
  CircularProgress,
  Typography
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

/**
 * UploadSection - Componente per la gestione dell'upload dei file
 * @param {Function} onUpload - Callback chiamata quando un file viene selezionato
 * @param {boolean} isUploading - Flag che indica se è in corso un upload
 * @param {string} error - Messaggio di errore da visualizzare
 */
const UploadSection = ({ onUpload, isUploading, error }) => {
  // Riferimento all'input file nascosto
  const fileInputRef = React.useRef();

  /**
   * Gestisce la selezione del file
   * @param {Event} event - Evento change dell'input file
   */
  const handleUpload = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('book', selectedFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'LIMIT_FILE_SIZE') {
          throw new Error('Il file è troppo grande. La dimensione massima consentita è 10MB.');
        }
        throw new Error(errorData.message || 'Si è verificato un errore durante il caricamento');
      }

      // ... resto del codice per gestire il successo
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger del click sull'input file nascosto
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Icona di upload/loading */}
      <Box sx={{ mb: 3, width: '48px', height: '48px' }}>
        <IconButton
          sx={{
            color: 'primary.main',
            '&:hover': { backgroundColor: 'transparent' },
          }}
          disableRipple
          disabled={isUploading}
        >
          {isUploading ? (
            <CircularProgress size={48} color="primary" />
          ) : (
            <CloudUploadIcon sx={{ fontSize: 48 }} />
          )}
        </IconButton>
      </Box>

      {/* Input file nascosto */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleUpload}
        accept=".pdf,.doc,.docx,.txt"
        disabled={isUploading}
      />

      {/* Pulsante visibile per l'upload */}
      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={<CloudUploadIcon />}
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        {isUploading ? 'CARICAMENTO...' : 'CARICA IL TUO LIBRO'}
      </Button>

      {/* Messaggio di errore */}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default UploadSection; 