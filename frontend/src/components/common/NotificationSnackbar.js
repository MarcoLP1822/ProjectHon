import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * NotificationSnackbar - Componente riutilizzabile per mostrare notifiche
 * @param {string} success - Messaggio di successo da mostrare
 * @param {string} error - Messaggio di errore da mostrare
 * @param {Function} onClose - Callback per chiudere la notifica
 */
const NotificationSnackbar = ({ success, error, onClose }) => {
  return (
    <>
      {/* Notifica di successo */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={onClose} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Notifica di errore */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={onClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationSnackbar; 