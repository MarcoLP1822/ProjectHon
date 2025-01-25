import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar
} from '@mui/material';
import { useBooks } from '../../context/BookContext';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
// eslint-disable-next-line no-unused-vars
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const { books, addBook, removeBook, updateBook, resetBookData } = useBooks();
  const [isUploading, setIsUploading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Sanitizziamo il nome del file
    const sanitizedFileName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // Rimuove gli accenti
      .replace(/[^\w\s.'()-]/g, '');     // Mantiene solo caratteri sicuri

    const renamedFile = new File([file], sanitizedFileName, {
      type: file.type,
    });

    // Validazione dell'estensione del file
    const validTypes = ['.pdf', '.doc', '.docx', '.epub'];
    const fileExtension = renamedFile.name.substring(renamedFile.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExtension)) {
      setError('Formato file non supportato. Usa PDF, DOC, DOCX o TXT.');
      return;
    }

    try {
      setIsUploading(true);
      await addBook({ file: renamedFile });
      setSuccess('Libro caricato con successo');
    } catch (error) {
      setError('Errore durante il caricamento del libro');
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMenuClick = (event, book) => {
    setAnchorEl(event.currentTarget);
    setSelectedBook(book);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRenameClick = () => {
    handleMenuClose();
    setNewBookName(selectedBook.title);
    setRenameDialogOpen(true);
  };

  const handleRenameClose = () => {
    setRenameDialogOpen(false);
    setNewBookName('');
  };

  const handleRenameConfirm = async () => {
    if (newBookName.trim() !== '') {
      await updateBook(selectedBook.id, { ...selectedBook, title: newBookName.trim() });
      handleRenameClose();
      setSuccess('Libro rinominato con successo');
    }
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await removeBook(selectedBook.id);
      handleDeleteClose();
      setSuccess('Libro eliminato con successo');
    } catch (error) {
      // Gestiamo l'errore ma consideriamo comunque il libro come eliminato
      // dato che probabilmente il file non esiste più
      console.error('Error deleting book:', error);
      handleDeleteClose();
      setSuccess('Libro rimosso dal sistema');
    }
  };

  const handleResetClick = async () => {
    handleMenuClose();
    try {
      await resetBookData(selectedBook.id);
      setSuccess('Reset completato con successo');
    } catch (error) {
      setError('Errore durante il reset del libro');
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  const sanitizeTitle = (title) => {
    return title
      .replace(/[\u0080-\u00ff]/g, (char) => {
        const specialChars = {
          '\u00e0': 'à',
          '\u00e8': 'è',
          '\u00e9': 'é',
          '\u00ec': 'ì',
          '\u00f2': 'ò',
          '\u00f9': 'ù',
        };
        return specialChars[char] || char;
      })
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035\u20ac]/g, "'");
  };

  // eslint-disable-next-line no-unused-vars
  const handleBookSelect = (book) => {
    // Per ora non facciamo nulla quando si clicca sulla riga
    // L'utente userà la sidebar per navigare tra le sezioni
  };

  const handleSaveApiKey = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/config/save-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        setSuccess('Chiave API OpenAI salvata con successo');
        setApiKey('');
      } else {
        const data = await response.json();
        setError(data.message || 'Errore nel salvare la chiave API');
      }
    } catch (error) {
      console.error('Errore:', error);
      setError('Errore nel salvare la chiave API');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Benvenut<span style={{ fontSize: '0.7em' }}>Ə</span>!
        </Typography>
      </Box>

      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          border: '2px dashed #E0E0E0',
          backgroundColor: '#FFFFFF',
          mb: 4
        }}
      >
        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          style={{ display: 'none' }}
          id="file-upload"
          onChange={handleFileUpload}
        />
        <label htmlFor="file-upload">
          <Button
            component="span"
            variant="contained"
            size="large"
            disabled={isUploading}
            startIcon={<UploadFileIcon />}
            sx={{ minWidth: 200 }}
          >
            {isUploading ? 'Caricamento...' : 'Carica libro'}
          </Button>
        </label>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Supporta file .doc, .docx, .pdf, .txt di max 10MB
          <br />
          File troppo grande? Se è un pdf, clicca qui per ridurlo di dimensioni: <a href="https://www.ilovepdf.com/it/comprimere_pdf" target="_blank" rel="noopener noreferrer">comprimi file</a>
          <br />
          Se il file è in formato word e supera i 10MB, prima <a href="https://www.ilovepdf.com/it/word_a_pdf" target="_blank" rel="noopener noreferrer">convertilo in pdf</a>, poi lo comprimi dal link qui sopra.
        </Typography>
      </Paper>

      {Array.isArray(books) && books.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome file</TableCell>
                <TableCell>Data caricamento</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.map((book) => (
                <TableRow 
                  key={book.id}
                  hover
                  sx={{ 
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <TableCell>{sanitizeTitle(book.title)}</TableCell>
                  <TableCell>{book.date}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, book);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Non ci sono libri caricati. Carica il tuo primo libro per iniziare!
          </Typography>
        </Paper>
      )}

      {/* Menu contestuale */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRenameClick}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Rinomina
        </MenuItem>
        <MenuItem onClick={handleResetClick}>
          <RestartAltIcon sx={{ mr: 1, fontSize: 20 }} />
          Reset Data
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Elimina
        </MenuItem>
      </Menu>

      {/* Dialog Rinomina */}
      <Dialog open={renameDialogOpen} onClose={handleRenameClose}>
        <DialogTitle>Rinomina Libro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Libro"
            type="text"
            fullWidth
            value={newBookName}
            onChange={(e) => setNewBookName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameClose}>Annulla</Button>
          <Button onClick={handleRenameConfirm} color="primary">
            Rinomina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Elimina */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>Elimina Libro</DialogTitle>
        <DialogContent>
          Sei sicuro di voler eliminare "{selectedBook?.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Annulla</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>

      {/* Aggiungi questa sezione prima del copyright */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Configurazione OpenAI
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Inserisci la chiave API di OpenAI"
            fullWidth
            size="small"
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowApiKey(!showApiKey)}
                  edge="end"
                  sx={{ mr: -1 }}
                >
                  {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSaveApiKey}
            sx={{ minWidth: 100 }}
          >
            Salva
          </Button>
        </Box>
      </Paper>

      {/* Aggiungo il copyright in fondo */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Creato da Marco Luigi Palma
        </Typography>
      </Box>
    </Container>
  );
};

export default Dashboard; 