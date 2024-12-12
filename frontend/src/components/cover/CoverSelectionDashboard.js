import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { useBooks } from '../../context/BookContext';

const CoverSelectionDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { books } = useBooks();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const bookId = location.state?.bookId;
  const scene = location.state?.scene;
  const sceneIndex = location.state?.index;

  const handleDownload = () => {
    if (scene.imageUrl) {
      const link = document.createElement('a');
      link.href = scene.imageUrl;
      link.download = `cover-${bookId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!bookId || !scene) {
    navigate('/tasks');
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          {scene.title || 'Dettaglio Copertina'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="body1" paragraph>
          {scene.description}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, position: 'relative' }}>
        {scene.imageUrl ? (
          <Box sx={{ position: 'relative' }}>
            <img 
              src={scene.imageUrl}
              alt="Cover"
              style={{ 
                width: '100%', 
                maxWidth: '600px',
                height: 'auto',
                display: 'block',
                margin: '0 auto',
                borderRadius: '8px'
              }}
            />
            <Box sx={{ 
              position: 'absolute',
              top: 16,
              right: 16,
              display: 'flex',
              gap: 1
            }}>
              <IconButton 
                onClick={handleDownload}
                sx={{ 
                  backgroundColor: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '400px'
          }}>
            <Typography variant="body1" color="text.secondary">
              Nessuna copertina disponibile
            </Typography>
          </Box>
        )}
      </Paper>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CoverSelectionDashboard; 