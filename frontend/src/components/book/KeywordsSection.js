import React from 'react';
import { Stack, Chip } from '@mui/material';
import { useBooks } from '../../context/BookContext';
import GenerativeSection from '../common/GenerativeSection';

const KeywordsSection = () => {
  const { generateKeywords, updateBookMetadata } = useBooks();

  const handleGenerate = async (bookId) => {
    const result = await generateKeywords(bookId);
    await updateBookMetadata(bookId, {
      keywords: result
    });
  };

  const renderContent = (book) => {
    if (!book?.metadata?.keywords?.keywords) return null;

    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
        {book.metadata.keywords.keywords.map((keyword, index) => (
          <Chip
            key={index}
            label={keyword}
            variant="outlined"
            sx={{ 
              borderRadius: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              borderColor: 'transparent'
            }}
          />
        ))}
      </Stack>
    );
  };

  return (
    <GenerativeSection
      title="Parole Chiave"
      emptyMessage="Nessuna parola chiave generata. Clicca il pulsante per generarne."
      generateButtonText="Genera Parole Chiave"
      onGenerate={handleGenerate}
      renderContent={renderContent}
    />
  );
};

export default KeywordsSection; 