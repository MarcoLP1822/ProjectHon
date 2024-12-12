import React from 'react';
import { Typography } from '@mui/material';
import { useBooks } from '../../context/BookContext';
import GenerativeSection from '../common/GenerativeSection';

const BackCoverSection = () => {
  const { generateBackCover, updateBookMetadata } = useBooks();

  const handleGenerate = async (bookId) => {
    const result = await generateBackCover(bookId);
    await updateBookMetadata(bookId, {
      backCover: result.backCover
    });
  };

  const renderContent = (book) => {
    if (!book?.metadata?.backCover) return null;
    
    return (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {book.metadata.backCover}
      </Typography>
    );
  };

  const sectionProps = {
    title: "Quarta di Copertina",
    emptyMessage: "Nessuna quarta di copertina generata. Clicca il pulsante per generarne una.",
    generateButtonText: "Genera Quarta di Copertina",
    onGenerate: handleGenerate,
    renderContent: renderContent
  };

  return <GenerativeSection {...sectionProps} />;
};

export default BackCoverSection; 