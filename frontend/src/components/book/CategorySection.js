import React, { useState, useMemo } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, CircularProgress, TextField, IconButton, Tooltip } from '@mui/material';
import { useBooks } from '../../context/BookContext';
import GenerativeSection from '../common/GenerativeSection';
import { useBisacCategories } from '../../hooks/useBisacCategories';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import debounce from 'lodash/debounce';
import Fuse from 'fuse.js';

const CategoryBox = ({ 
  type, 
  title, 
  expanded, 
  onToggle, 
  searchTerm,
  onSearch,
  loading,
  categories,
  selectedCategory,
  onSelect,
  onCopy 
}) => (
  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <Box
      onClick={onToggle}
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        mb: 1,
        cursor: 'pointer'
      }}
    >
      {expanded ? 
        <KeyboardArrowDownIcon sx={{ mr: 1 }} /> : 
        <KeyboardArrowRightIcon sx={{ mr: 1 }} />
      }
      <Typography 
        variant="subtitle1" 
        sx={{ 
          fontWeight: 500,
          textAlign: 'left',
        }}
      >
        {title}
      </Typography>
    </Box>
    
    {expanded && (
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
            name={`${type}-search`}
            size="small"
            fullWidth
            placeholder="Cerca..."
            onChange={(e) => onSearch(e.target.value)}
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
              {categories?.map((category, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton 
                    onClick={() => onSelect(category)}
                    selected={selectedCategory?.code === category.code}
                  >
                    <ListItemText primary={category.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    )}
    
    {selectedCategory && (
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ color: 'primary.main', flex: 1 }}>
          Selezionato: {selectedCategory.name}
        </Typography>
        <Tooltip title="Copia categoria">
          <IconButton 
            size="small"
            onClick={() => onCopy(selectedCategory.name)}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    )}
  </Box>
);

const CategorySection = () => {
  const { generateCategories, updateBookMetadata } = useBooks();
  const { categories, loading } = useBisacCategories();
  const [selectedCategories, setSelectedCategories] = useState({
    fiction: null,
    nonfiction: null,
    juv: null,
  });

  const [expandedSections, setExpandedSections] = useState({
    fiction: false,
    nonfiction: false,
    juv: false,
  });

  const [searchTerms, setSearchTerms] = useState({
    fiction: '',
    nonfiction: '',
    juv: '',
  });

  const fuseInstances = useMemo(() => {
    if (!loading && Object.keys(categories).length > 0) {
      const instances = {};
      Object.entries(categories).forEach(([type, categoryList]) => {
        instances[type] = new Fuse(categoryList, {
          keys: ['name'],
          threshold: 0.3,
          distance: 100
        });
      });
      return instances;
    }
    return {};
  }, [categories, loading]);

  const filteredCategories = useMemo(() => {
    const result = {};
    Object.keys(categories).forEach(type => {
      if (!categories[type]) {
        result[type] = [];
        return;
      }
      
      const searchTerm = searchTerms[type];
      if (!searchTerm) {
        result[type] = categories[type].slice(0, 100);
        return;
      }

      if (fuseInstances[type]) {
        result[type] = fuseInstances[type]
          .search(searchTerm)
          .slice(0, 50)
          .map(result => result.item);
      } else {
        result[type] = [];
      }
    });
    return result;
  }, [categories, searchTerms, fuseInstances]);

  const debouncedSearchChange = useMemo(
    () => debounce((type, value) => {
      setSearchTerms(prev => ({
        ...prev,
        [type]: value
      }));
    }, 300),
    []
  );

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

  const handleCopyCategory = (category) => {
    navigator.clipboard.writeText(category);
  };

  const toggleSection = (type) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const renderContent = (book) => {
    const categories = book?.metadata?.categories;

    return (
      <Box>
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

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          width: '100%'
        }}>
          {['fiction', 'nonfiction', 'juv'].map(type => (
            <CategoryBox
              key={type}
              type={type}
              title={
                type === 'fiction' ? 'FICTION, POESIA, BIOGRAFIE' :
                type === 'nonfiction' ? 'NON FICTION' : 'RAGAZZI'
              }
              expanded={expandedSections[type]}
              onToggle={() => toggleSection(type)}
              searchTerm={searchTerms[type]}
              onSearch={(value) => debouncedSearchChange(type, value)}
              loading={loading}
              categories={filteredCategories[type]}
              selectedCategory={selectedCategories[type]}
              onSelect={(category) => handleCategorySelect(type, category)}
              onCopy={handleCopyCategory}
            />
          ))}
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

export default React.memo(CategorySection); 