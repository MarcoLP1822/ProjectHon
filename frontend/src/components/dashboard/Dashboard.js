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
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../../context/BookContext';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const Dashboard = () => {
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validazione dell'estensione del file
    const validTypes = ['.pdf', '.doc', '.docx', '.epub'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExtension)) {
      setError('Formato file non supportato. Usa PDF, DOC, DOCX o EPUB.');
      return;
    }

    try {
      setIsUploading(true);
      await addBook({ file });
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

  const handleBookSelect = (book) => {
    // Per ora non facciamo nulla quando si clicca sulla riga
    // L'utente userà la sidebar per navigare tra le sezioni
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Benvenuto!
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Carica il tuo libro per iniziare a ottimizzare la tua presenza online
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
          accept=".epub,.pdf,.doc,.docx"
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
          Supporta file .epub, .pdf, .doc, .docx
        </Typography>
      </Paper>

      {books && books.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Titolo</TableCell>
                <TableCell>Data</TableCell>
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
                  <TableCell>{book.title}</TableCell>
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
    </Container>
  );
};

export default Dashboard; 