import { useState, useEffect } from 'react';
import axios from 'axios';

export const useBisacCategories = () => {
  const [categories, setCategories] = useState({
    fiction: [],
    humanities: [],
    selfhelp: [],
    juv: [],
    stem: [],
    religion: [],
    art: [],
    svago: [],
    varie: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/bisac/categories');
        console.log('Categorie ricevute:', response.data);
        setCategories(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Errore nel caricamento categorie:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}; 