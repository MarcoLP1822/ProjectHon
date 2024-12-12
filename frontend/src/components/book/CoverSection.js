import React, { useState } from 'react';
import { 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  CardActions, 
  Button,
  Alert,
  Box
} from '@mui/material';
import { useBooks } from '../../context/BookContext';
import GenerativeSection from '../common/GenerativeSection';

const CoverSection = () => {
  const { generateScenes, generateCoverImages, updateBookMetadata } = useBooks();
  const [error, setError] = useState(null);

  const handleGenerate = async (bookId) => {
    try {
      setError(null);
      
      // Prima generiamo le scene
      const scenesResponse = await generateScenes(bookId);
      
      // Poi generiamo le copertine basate sulle scene
      const coversResponse = await generateCoverImages(bookId, scenesResponse.scenes);
      
      // Aggiorniamo i metadata del libro
      await updateBookMetadata(bookId, {
        covers: {
          scenes: coversResponse.covers
        }
      });
    } catch (err) {
      // Gestiamo specificamente l'errore di content policy
      if (err.code === 'CONTENT_POLICY_VIOLATION') {
        setError(err.message);
      } else {
        setError('Si è verificato un errore durante la generazione delle copertine. Riprova più tardi.');
      }
    }
  };

  const renderContent = (book) => {
    return (
      <>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {book?.metadata?.covers?.scenes && (
          <Grid container spacing={3}>
            {book.metadata.covers.scenes.map((scene, index) => (
              <Grid item xs={12} key={index}>
                <Card sx={{ 
                  display: 'flex',
                  height: '300px'  // Altezza fissa per la card
                }}>
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: '300px',  // Larghezza fissa per l'immagine
                      objectFit: 'contain',
                      bgcolor: 'grey.100'  // Sfondo leggero per le immagini
                    }}
                    image={scene.imageUrl}
                    alt={`Cover ${index + 1}`}
                  />
                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    p: 2
                  }}>
                    <CardContent sx={{ flex: '1 0 auto' }}>
                      <Typography variant="h6" gutterBottom>
                        {scene.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {scene.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" color="primary">
                        Seleziona
                      </Button>
                    </CardActions>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </>
    );
  };

  const sectionProps = {
    title: "Copertine",
    emptyMessage: "Nessuna copertina generata. Clicca il pulsante per generarne.",
    generateButtonText: "Genera Copertine",
    onGenerate: handleGenerate,
    renderContent: renderContent
  };

  return <GenerativeSection {...sectionProps} />;
};

export default CoverSection; 