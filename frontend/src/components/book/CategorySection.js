import React from 'react';
import { Box, Typography } from '@mui/material';
import { useBooks } from '../../context/BookContext';
import GenerativeSection from '../common/GenerativeSection';

const CategorySection = () => {
  const { generateCategories, updateBookMetadata } = useBooks();

  const handleGenerate = async (bookId) => {
    const result = await generateCategories(bookId);
    
    if (!result || (!result.mainCategory && !result.secondaryCategories)) {
      throw new Error('Formato categorie non valido');
    }
    
    await updateBookMetadata(bookId, {
      categories: result
    });
  };

  const renderContent = (book) => {
    const categories = book?.metadata?.categories;
    if (!categories?.mainCategory) return null;

    return (
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
            Categoria Principale
          </Typography>
          <Typography variant="body2">
            {categories.mainCategory}
          </Typography>
        </Box>

        {categories.secondaryCategories && categories.secondaryCategories.length > 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              Categorie Secondarie
            </Typography>
            {categories.secondaryCategories.map((category, index) => (
              <Typography key={index} variant="body2">
                {category}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const sectionProps = {
    title: "Categorie BISAC",
    emptyMessage: "Nessuna categoria generata. Clicca il pulsante per generarne.",
    generateButtonText: "Genera Categorie",
    onGenerate: handleGenerate,
    renderContent: renderContent
  };

  return <GenerativeSection {...sectionProps} />;
};

export default CategorySection; 