const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite di richieste per IP
  message: 'Too many requests from this IP, please try again later'
});

module.exports = aiLimiter; 