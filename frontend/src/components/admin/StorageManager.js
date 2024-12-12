import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { bookService } from '../../services/api';

const StorageManager = () => {
  const [storageStatus, setStorageStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isForceCleanup, setIsForceCleanup] = useState(false);

  const loadStorageStatus = async () => {
    try {
      setLoading(true);
      const status = await bookService.getStorageStatus();
      setStorageStatus(status);
    } catch (error) {
      setError('Failed to load storage status');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupConfirm = async () => {
    try {
      setLoading(true);
      const result = await bookService.cleanupStorage(isForceCleanup);
      setSuccess(`Cleanup completed. ${result.deletedFiles?.length || 0} files deleted.`);
      loadStorageStatus();
    } catch (error) {
      setError('Failed to cleanup storage');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleCleanupClick = (force = false) => {
    setIsForceCleanup(force);
    setConfirmDialogOpen(true);
  };

  useEffect(() => {
    loadStorageStatus();
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Storage Manager</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh status">
              <IconButton onClick={() => loadStorageStatus()} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button 
              variant="outlined" 
              onClick={() => handleCleanupClick(false)}
              disabled={loading}
            >
              Clean Old Files
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => handleCleanupClick(true)}
              disabled={loading}
            >
              Force Cleanup All
            </Button>
          </Box>
        </Box>

        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {storageStatus && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1">Storage Overview</Typography>
              <Typography>Total Files: {storageStatus.totalFiles}</Typography>
              <Typography>Total Size: {formatBytes(storageStatus.totalSize)}</Typography>
              <Typography>Last Updated: {formatDate(storageStatus.timestamp)}</Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Filename</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Modified</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {storageStatus.files.map((file) => (
                    <TableRow key={file.name}>
                      <TableCell>{file.name}</TableCell>
                      <TableCell>{formatBytes(file.size)}</TableCell>
                      <TableCell>{formatDate(file.created)}</TableCell>
                      <TableCell>{formatDate(file.modified)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      <Dialog 
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="cleanup-dialog-title"
      >
        <DialogTitle id="cleanup-dialog-title">
          Confirm Cleanup
        </DialogTitle>
        <DialogContent>
          <Typography>
            {isForceCleanup 
              ? 'Are you sure you want to force cleanup all files?' 
              : 'Are you sure you want to cleanup old files?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCleanupConfirm} color="error" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StorageManager; 