import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5002/api'
});

export const bookService = {
  uploadBook: async (file) => {
    const formData = new FormData();
    formData.append('book', file);
    const response = await api.post('/books/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getBooks: async () => {
    const response = await api.get('/books');
    return response.data;
  },

  deleteBook: async (id) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  updateBook: async (id, data) => {
    const response = await api.put(`/books/${id}`, data);
    return response.data;
  },

  generateCategories: async (bookId) => {
    const response = await api.post(`/ai/categories/${bookId}`);
    return response.data;
  },

  generateKeywords: async (bookId) => {
    const response = await api.post(`/ai/keywords/${bookId}`);
    return response.data;
  },

  getStorageStatus: async () => {
    const response = await api.get('/books/storage-status');
    return response.data;
  },

  cleanupStorage: async (force = false) => {
    const response = await api.post(`/books/cleanup?force=${force}`);
    return response.data;
  },

  generateScenes: async (bookId) => {
    const response = await api.post(`/ai/scenes/${bookId}`);
    return response.data;
  },

  generateCoverImages: async (bookId, scenes) => {
    console.log('API: Sending scenes data:', JSON.stringify(scenes, null, 2));
    
    // Validazione base
    if (!Array.isArray(scenes)) {
      throw new Error('Scenes must be an array');
    }
    
    if (scenes.length === 0) {
      throw new Error('Scenes array is empty');
    }
    
    // Verifica che ogni scena abbia i campi necessari
    scenes.forEach((scene, index) => {
      if (!scene.title || !scene.description) {
        throw new Error(`Scene at index ${index} is missing required fields`);
      }
    });
    
    const response = await api.post(`/ai/covers/${bookId}`, { scenes });
    return response.data;
  },

  resetBookData: async (bookId) => {
    const response = await api.post(`/books/${bookId}/reset`);
    return response.data;
  },

  generateBackCover: async (bookId) => {
    const response = await api.post(`/ai/backcover/${bookId}`);
    return response.data;
  },

  generatePreface: async (bookId) => {
    const response = await api.post(`/ai/preface/${bookId}`);
    return response.data;
  },

  generateStoreDescription: async (bookId) => {
    const response = await api.post(`/ai/store-description/${bookId}`);
    return response.data;
  },

  generateSynopsis: async (bookId) => {
    const response = await api.post(`/ai/synopsis/${bookId}`);
    return response.data;
  },
}; 