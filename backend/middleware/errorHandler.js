const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Errori di validazione personalizzati
  if (err.name === 'ValidationError') {
    return res.status(err.status || 400).json({
      message: err.message,
      error: err.errors || err.message
    });
  }

  // Errori di validazione MongoDB
  if (err.name === 'MongooseValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      error: Object.values(err.errors).map(e => e.message)
    });
  }

  // Errori di ID MongoDB non valido
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      error: 'The provided ID is not valid'
    });
  }

  // Errori di OpenAI
  if (err.name === 'OpenAIError') {
    return res.status(503).json({
      message: 'AI Service Error',
      error: err.message
    });
  }

  // Errori di file system
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      message: 'File Not Found',
      error: 'The requested file could not be found'
    });
  }

  // Errori generici
  return res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler; 