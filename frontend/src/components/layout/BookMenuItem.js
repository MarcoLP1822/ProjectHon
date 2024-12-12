import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useLocation, useNavigate } from 'react-router-dom';

const BookMenuItem = ({ book, sections, isExpanded, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isBookActive = currentPath.includes(`/book/${book.id}`);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          selected={isBookActive}
          role="button"
          tabIndex={0}
          sx={{
            borderRadius: '8px',
            mb: 0.5,
            '&.Mui-selected': {
              backgroundColor: 'primary.lighter',
              '&:hover': {
                backgroundColor: 'primary.lighter'
              }
            }
          }}
        >
          <ListItemIcon>
            <MenuBookIcon />
          </ListItemIcon>
          <ListItemText 
            primary={book.title}
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: isBookActive ? 600 : 400
            }}
          />
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
      </ListItem>

      <Collapse 
        in={isExpanded} 
        timeout="auto" 
        unmountOnExit
        tabIndex={-1}
      >
        <List 
          component="div" 
          disablePadding
          role="menu"
          aria-label={`Sezioni di ${book.title}`}
        >
          {sections.map((section) => (
            <ListItem key={section.title} disablePadding>
              <ListItemButton
                onClick={() => navigate(`/book/${book.id}/${section.path}`)}
                selected={currentPath === `/book/${book.id}/${section.path}`}
                role="menuitem"
                tabIndex={isExpanded ? 0 : -1}
                sx={{
                  pl: 4,
                  borderRadius: '8px',
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.lighter',
                    '&:hover': {
                      backgroundColor: 'primary.lighter'
                    }
                  }
                }}
              >
                <ListItemIcon>
                  {section.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={section.title}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: currentPath === `/book/${book.id}/${section.path}` ? 600 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
};

export default BookMenuItem; 