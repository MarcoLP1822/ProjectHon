import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import ImageIcon from '@mui/icons-material/Image';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import KeyIcon from '@mui/icons-material/Key';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useBooks } from '../../context/BookContext';
import BookMenuItem from './BookMenuItem';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { books } = useBooks();
  const [expandedBooks, setExpandedBooks] = useState({});

  const handleToggleBook = (bookId) => {
    setExpandedBooks(prev => ({
      ...prev,
      [bookId]: !prev[bookId]
    }));
  };

  const bookSections = [
    { 
      title: 'Categorie', 
      path: 'categories',
      icon: <CategoryIcon />
    },
    { 
      title: 'Parole Chiave', 
      path: 'keywords',
      icon: <KeyIcon />
    },
    { 
      title: 'Sinossi', 
      path: 'synopsis',
      icon: <DescriptionIcon />
    },
    { 
      title: 'Quarta di Copertina', 
      path: 'backcover',
      icon: <MenuBookIcon />
    },
    { 
      title: 'Prefazione', 
      path: 'preface',
      icon: <AutoStoriesIcon />
    },
    { 
      title: 'Copertina', 
      path: 'cover',
      icon: <ImageIcon />
    }
  ];

  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        borderRight: '1px solid #E0E0E0',
        backgroundColor: '#FFFFFF',
        p: 3,
        position: 'fixed',
        left: 0,
        top: 0,
        overflowY: 'auto'
      }}
    >
      <Typography variant="h6" sx={{ mb: 3 }}>
        Book Editor
      </Typography>

      <List>
        {/* Dashboard Button */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate('/')}
            selected={location.pathname === '/'}
            sx={{
              borderRadius: '8px',
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.lighter',
                '&:hover': {
                  backgroundColor: 'primary.lighter'
                }
              }
            }}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Dashboard"
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: location.pathname === '/' ? 600 : 400
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Admin Button */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate('/admin/storage')}
            selected={location.pathname.startsWith('/admin')}
            sx={{
              borderRadius: '8px',
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.lighter',
                '&:hover': {
                  backgroundColor: 'primary.lighter'
                }
              }
            }}
          >
            <ListItemIcon>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Admin"
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: location.pathname.startsWith('/admin') ? 600 : 400
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Books with their sections */}
        {books.map((book) => (
          <BookMenuItem
            key={book.id}
            book={book}
            sections={bookSections}
            isExpanded={expandedBooks[book.id]}
            onToggle={() => handleToggleBook(book.id)}
          />
        ))}
      </List>
    </Box>
  );
};

export default Sidebar; 