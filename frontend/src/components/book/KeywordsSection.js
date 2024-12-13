import React from 'react';
import { Stack, Typography } from '@mui/material';
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
      <Stack direction="column" spacing={1}>
        {book.metadata.keywords.keywords.map((keyword, index) => (
          <Typography 
            key={index} 
            variant="body2"
          >
            {keyword}
          </Typography>
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