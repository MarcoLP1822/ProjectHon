import { useState, useEffect } from 'react';
import axios from 'axios';

export const useBisacCategories = () => {
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/bisac/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Errore nel caricamento delle categorie:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
}; 