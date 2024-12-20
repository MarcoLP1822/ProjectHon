const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post('/save-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ message: 'API key is required' });
    }

    const envPath = path.join(__dirname, '..', '.env');
    
    // Leggi il contenuto attuale del file .env
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf-8');
    } catch (error) {
      console.error('Error reading .env file:', error);
      return res.status(500).json({ message: 'Error reading configuration file' });
    }

    // Mantieni le variabili esistenti
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        envVars[key.trim()] = values.join('=').trim();
      }
    });

    // Aggiorna la chiave API
    envVars['OPENAI_API_KEY'] = apiKey;

    // Ricostruisci il contenuto del file
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Scrivi il nuovo contenuto nel file .env
    try {
      fs.writeFileSync(envPath, newEnvContent + '\n');
      res.status(200).json({ message: 'API key saved successfully' });
    } catch (error) {
      console.error('Error writing .env file:', error);
      res.status(500).json({ message: 'Error saving API key' });
    }
  } catch (error) {
    console.error('Error in save-api-key route:', error);
    res.status(500).json({ message: 'Error saving API key' });
  }
});

// Aggiungi una route per verificare se la chiave è stata salvata
router.get('/check-api-key', async (req, res) => {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const hasApiKey = envContent.includes('OPENAI_API_KEY=') && 
                     envContent.split('OPENAI_API_KEY=')[1]?.trim().length > 0;
    
    res.json({ hasApiKey });
  } catch (error) {
    console.error('Error checking API key:', error);
    res.status(500).json({ message: 'Error checking API key' });
  }
});

module.exports = router; 