import fs from 'fs';
import path from 'path';
import { encrypt } from '../../utils/crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { apiKey } = req.body;
    const encryptedKey = encrypt(apiKey);
    const envPath = path.join(process.cwd(), '.env');
    
    // Leggi il contenuto attuale del file .env
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf-8');
    } catch (error) {
      envContent = '';
    }

    // Aggiorna o aggiungi la chiave API criptata
    const envLines = envContent.split('\n');
    const openAiKeyIndex = envLines.findIndex(line => 
      line.startsWith('OPENAI_API_KEY=')
    );

    if (openAiKeyIndex >= 0) {
      envLines[openAiKeyIndex] = `OPENAI_API_KEY=${encryptedKey}`;
    } else {
      envLines.push(`OPENAI_API_KEY=${encryptedKey}`);
    }

    // Scrivi il nuovo contenuto nel file .env
    fs.writeFileSync(envPath, envLines.join('\n'));

    res.status(200).json({ message: 'API key saved successfully' });
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ message: 'Error saving API key' });
  }
} 