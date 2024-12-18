import React from 'react';
import { Typography } from '@mui/material';
import { useBooks } from '../../context/BookContext';
import GenerativeSection from '../common/GenerativeSection';

const PrefaceSection = () => {
  const { generatePreface, updateBookMetadata } = useBooks();

  const handleGenerate = async (bookId) => {
    const result = await generatePreface(bookId);
    await updateBookMetadata(bookId, {
      preface: result.preface
    });
  };

  const renderContent = (book) => {
    if (!book?.metadata?.preface) return null;
    
    return (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {book.metadata.preface}
      </Typography>
    );
  };

  return (
    <GenerativeSection
      title="Prefazione"
      emptyMessage="Nessuna prefazione generata. Clicca il pulsante per generarne una."
      generateButtonText="Genera Prefazione"
      onGenerate={handleGenerate}
      renderContent={renderContent}
      contentType="preface"
    />
  );
};

export default PrefaceSection; 