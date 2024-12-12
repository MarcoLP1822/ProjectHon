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
  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUpload(file);
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