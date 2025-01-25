const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Aggiungiamo opzioni per gestire meglio la connessione
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout dopo 5 secondi
      socketTimeoutMS: 45000, // Chiudi socket dopo 45 secondi
    };

    // Verifica che l'URI sia definito
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MongoDB URI non definito nel file .env');
    }

    console.log('Tentativo di connessione a MongoDB...');
    
    await mongoose.connect(mongoURI, options);
    
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Riprova la connessione dopo 5 secondi
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB; 