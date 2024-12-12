import React from 'react';
import { Typography } from '@mui/material';
import { useBooks } from '../../context/BookContext';
import GenerativeSection from '../common/GenerativeSection';

const SynopsisSection = () => {
  const { generateSynopsis, updateBookMetadata } = useBooks();

  const handleGenerate = async (bookId) => {
    const result = await generateSynopsis(bookId);
    await updateBookMetadata(bookId, {
      synopsis: result.synopsis
    });
  };

  const renderContent = (book) => {
    if (!book?.metadata?.synopsis) return null;
    
    return (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {book.metadata.synopsis}
      </Typography>
    );
  };

  const sectionProps = {
    title: "Sinossi",
    emptyMessage: "Nessuna sinossi generata. Clicca il pulsante per generarne una.",
    generateButtonText: "Genera Sinossi",
    onGenerate: handleGenerate,
    renderContent: renderContent
  };

  return <GenerativeSection {...sectionProps} />;
};

export default SynopsisSection; 