import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, CircularProgress, TextField, IconButton, Tooltip } from '@mui/material';
import { useBooks } from '../../context/BookContext';
import GenerativeSection from '../common/GenerativeSection';
import { useBisacCategories } from '../../hooks/useBisacCategories';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const CategorySection = () => {
  const { generateCategories, updateBookMetadata } = useBooks();
  const { categories, loading } = useBisacCategories();
  const [selectedCategories, setSelectedCategories] = useState({
    fiction: null,
    humanities: null,
    juv: null,
    selfhelp: null,
    stem: null,
    religion: null,
    art: null,
    svago: null,
    varie: null
  });

  const [searchTerms, setSearchTerms] = useState({
    fiction: '',
    humanities: '',
    juv: '',
    selfhelp: '',
    stem: '',
    religion: '',
    art: '',
    svago: '',
    varie: ''
  });

  const handleGenerate = async (bookId) => {
    const result = await generateCategories(bookId);
    
    if (!result || (!result.mainCategory && !result.secondaryCategories)) {
      throw new Error('Formato categorie non valido');
    }
    
    await updateBookMetadata(bookId, {
      categories: result
    });
  };

  const handleCategorySelect = (type, category) => {
    setSelectedCategories(prev => ({
      ...prev,
      [type]: category
    }));
  };

  const handleSearchChange = (type, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleCopyCategory = (category) => {
    navigator.clipboard.writeText(category);
  };

  const renderCategoryBox = (type, title) => (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, textAlign: 'left' }}>
        {title}
      </Typography>
      <Box sx={{ 
        flex: 1,
        maxHeight: 250,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ p: 1, backgroundColor: 'white' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Cerca..."
            value={searchTerms[type]}
            onChange={(e) => handleSearchChange(type, e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
              }
            }}
          />
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {categories[type]
                ?.filter(category => 
                  category.name.toLowerCase().includes(searchTerms[type].toLowerCase())
                )
                .map((category, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton 
                      onClick={() => handleCategorySelect(type, category)}
                      selected={selectedCategories[type]?.code === category.code}
                    >
                      <ListItemText primary={category.name} />
                    </ListItemButton>
                  </ListItem>
                ))
              }
            </List>
          )}
        </Box>
      </Box>
      {selectedCategories[type] && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'primary.main', flex: 1 }}>
            Selezionato: {selectedCategories[type].name}
          </Typography>
          <Tooltip title="Copia categoria">
            <IconButton 
              size="small"
              onClick={() => handleCopyCategory(selectedCategories[type].name)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  const renderContent = (book) => {
    const categories = book?.metadata?.categories;

    return (
      <Box>
        {/* Sezione categorie suggerite - opzionale */}
        {categories?.mainCategory && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                Categoria Principale
              </Typography>
              <Typography variant="body2">
                {categories.mainCategory}
              </Typography>
            </Box>

            {categories.secondaryCategories && categories.secondaryCategories.length > 0 && (
              <Box sx={{ mb: 4 }}>
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
          </>
        )}

        {/* Sezione box categorie - sempre visibile */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          width: '100%'
        }}>
          {renderCategoryBox('fiction', 'FICTION, POESIA, BIOGRAFIE, DRAMMI, FUMETTI')}
          {renderCategoryBox('humanities', 'DISCIPLINE UMANISTICHE')}
          {renderCategoryBox('juv', 'RAGAZZI')}
          {renderCategoryBox('selfhelp', 'SELF-HELP, PSICOLOGIA, FAMIGLIA E RELAZIONI')}
          {renderCategoryBox('stem', 'STEM')}
          {renderCategoryBox('religion', 'RELIGIONE')}
          {renderCategoryBox('art', 'ARTE')}
          {renderCategoryBox('svago', 'TEMPO LIBERO')}
          {renderCategoryBox('varie', 'VARIE')}
        </Box>
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