import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import theme from './utils/theme';
import { BookProvider } from './context/BookContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import StorageManager from './components/admin/StorageManager';
import SynopsisSection from './components/book/SynopsisSection';
import CategorySection from './components/book/CategorySection';
import CoverSection from './components/book/CoverSection';
import BackCoverSection from './components/book/BackCoverSection';
import PrefaceSection from './components/book/PrefaceSection';
import StoreDescriptionSection from './components/book/StoreDescriptionSection';
import KeywordsSection from './components/book/KeywordsSection';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BookProvider>
        <Router>
          <Box sx={{ display: 'flex' }}>
            <Sidebar />
            <Box sx={{ marginLeft: '280px', flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/book/:id/synopsis" element={<SynopsisSection />} />
                <Route path="/book/:id/categories" element={<CategorySection />} />
                <Route path="/book/:id/cover" element={<CoverSection />} />
                <Route path="/book/:id/backcover" element={<BackCoverSection />} />
                <Route path="/book/:id/preface" element={<PrefaceSection />} />
                <Route path="/book/:id/store" element={<StoreDescriptionSection />} />
                <Route path="/book/:id/keywords" element={<KeywordsSection />} />
                <Route path="/admin/storage" element={<StorageManager />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </BookProvider>
    </ThemeProvider>
  );
}

export default App; 