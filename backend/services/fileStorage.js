const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Crea la directory uploads se non esiste
const uploadDir = 'uploads';
const createUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(uploadDir, { recursive: true });
    }
  }
};

// Funzione per pulire i file temporanei più vecchi di 24 ore
const cleanupTempFiles = async (force = false) => {
  try {
    const files = await fs.readdir(uploadDir);
    const now = Date.now();
    const deletedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.stat(filePath);

        // Se force è true o il file è più vecchio di 24 ore
        if (force || now - stats.mtime.getTime() > 24 * 60 * 60 * 1000) {
          try {
            await fs.unlink(filePath);
            deletedFiles.push(file);
            console.log(`Deleted file: ${file}`);
          } catch (unlinkError) {
            if (unlinkError.code === 'EPERM') {
              // Se il file è in uso, proviamo a rimuovere i permessi
              await fs.chmod(filePath, 0o666);
              await fs.unlink(filePath);
              deletedFiles.push(file);
            } else {
              errors.push({ file, error: unlinkError.message });
            }
          }
        }
      } catch (error) {
        errors.push({ file, error: error.message });
      }
    }

    return {
      success: true,
      deletedFiles,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('Error in cleanup:', error);
    throw error;
  }
};

// Inizializza la directory all'avvio
createUploadDir().catch(console.error);

// Esegui la pulizia ogni 12 ore
setInterval(cleanupTempFiles, 12 * 60 * 60 * 1000);

// Funzione per ottenere lo stato della directory
const getDirectoryStatus = async () => {
  try {
    // Verifichiamo che la directory esista
    try {
      await fs.access(uploadDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(uploadDir, { recursive: true });
      }
    }

    const files = await fs.readdir(uploadDir);
    const filesStats = await Promise.all(
      files.map(async file => {
        try {
          const filePath = path.join(uploadDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isDirectory: stats.isDirectory()
          };
        } catch (error) {
          console.warn(`Error getting stats for file ${file}:`, error);
          return null;
        }
      })
    );

    const validStats = filesStats.filter(stat => stat !== null);

    return {
      totalFiles: validStats.length,
      totalSize: validStats.reduce((acc, file) => acc + file.size, 0),
      files: validStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting directory status:', error);
    throw error;
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Verifica il tipo di file
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedTypes.includes(ext)) {
    return cb(new Error('File type not allowed. Only PDF, DOC, DOCX and TXT files are accepted.'), false);
  }

  // Verifica la dimensione del file (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return cb(new Error('File too large. Maximum size is 10MB.'), false);
  }

  cb(null, true);
};

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large',
        error: 'Maximum file size is 10MB'
      });
    }
    return res.status(400).json({
      message: 'File upload error',
      error: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      message: 'File upload error',
      error: err.message
    });
  }

  next();
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

module.exports = {
  upload,
  errorHandler,
  cleanupTempFiles,
  getDirectoryStatus
}; 