const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bookRoutes = require('./routes/book.routes');
const aiRoutes = require('./routes/ai.routes');
const bisacRoutes = require('./routes/bisac.routes');
const configRoutes = require('./routes/config.routes');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Aumentiamo i limiti per il body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware globali
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/bisac', bisacRoutes);
app.use('/api/config', configRoutes);

// Error Handler (deve essere dopo tutte le routes)
app.use(errorHandler);

// 404 handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

module.exports = app;

// Gestione errori non catturati
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
}); 