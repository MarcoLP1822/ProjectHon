const OpenAI = require('openai');
const { encoding_for_model } = require('@dqbd/tiktoken');
const { validators } = require('../utils/validators');

// Costanti di configurazione
const CONSTANTS = {
  TOKEN_LIMIT: 8000,
  CACHE_SIZE_LIMIT: 100,
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // in millisecondi
  },
  MODEL: 'gpt-4o-mini'
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const logGeneration = (type, tokens, truncated = false) => {
  console.log(`[${type.toUpperCase()}] Generation stats:`);
  console.log(`- Original tokens: ${tokens}`);
  if (truncated) {
    console.log(`- Truncated to: ${CONSTANTS.TOKEN_LIMIT} tokens`);
  }
  console.log(`- Model: ${CONSTANTS.MODEL}`);
  console.log('-------------------');
};

const truncationCache = new Map();

const getCacheKey = (text, maxTokens, type) => {
  return `${text.length}_${maxTokens}_${type}`;
};

const truncateToTokenLimit = (text, maxTokens = CONSTANTS.TOKEN_LIMIT, type = 'unknown') => {
  const cacheKey = getCacheKey(text, maxTokens, type);
  
  if (truncationCache.has(cacheKey)) {
    console.log(`[${type.toUpperCase()}] Using cached truncation`);
    return truncationCache.get(cacheKey);
  }
  
  try {
    const enc = encoding_for_model(CONSTANTS.MODEL);
    const tokens = enc.encode(text);
    
    logGeneration(type, tokens.length, tokens.length > maxTokens);
    
    let result;
    if (tokens.length <= maxTokens) {
      result = text;
    } else {
      const truncatedTokens = tokens.slice(0, maxTokens);
      result = enc.decode(truncatedTokens);
    }
    
    enc.free();
    
    truncationCache.set(cacheKey, result);
    
    if (truncationCache.size > CONSTANTS.CACHE_SIZE_LIMIT) {
      const oldestKey = truncationCache.keys().next().value;
      truncationCache.delete(oldestKey);
    }
    
    return result;
  } catch (error) {
    console.error(`[${type.toUpperCase()}] Error in token counting:`, error);
    const truncated = text.slice(0, maxTokens * 4);
    return truncated;
  }
};

const cleanJsonResponse = (response) => {
  return response.replace(/```json|```/g, '').trim();
};

const handleOpenAIError = (error) => {
  if (error.error?.code === 'content_policy_violation') {
    throw {
      status: 400,
      message: 'Il contenuto è stato bloccato dai filtri di sicurezza di OpenAI. Per favore, verifica che il contenuto rispetti le linee guida e non contenga elementi sensibili o inappropriati.',
      code: 'CONTENT_POLICY_VIOLATION'
    };
  }
  // Rilancia l'errore originale se non è un content policy violation
  throw error;
};

const withRetry = async (operation, maxRetries = CONSTANTS.RETRY.MAX_ATTEMPTS, delay = CONSTANTS.RETRY.INITIAL_DELAY) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Non ritentare per errori di content policy
      if (error.code === 'CONTENT_POLICY_VIOLATION') {
        throw error;
      }
      
      console.log(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
      
      if (error.status === 429) { // Rate limit
        delay *= 2; // Exponential backoff
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

const validateResponse = (type, result) => {
  // Validazioni che usano il validator importato
  if (type === 'categories') {
    if (!validators.categories.validateResult(result)) {
      throw new Error('Invalid categories format');
    }
    return result;
  }

  if (type === 'keywords') {
    if (!validators.keywords.validateResult(result)) {
      throw new Error('Invalid keywords format received from OpenAI');
    }
    return result;
  }

  if (type === 'synopsis') {
    if (!validators.synopsis.validateResult(result)) {
      throw new Error('Invalid synopsis format received from OpenAI');
    }
    return result;
  }

  if (type === 'backCover') {
    if (!validators.backCover.validateResult(result)) {
      throw new Error('Invalid back cover format received from OpenAI');
    }
    return result;
  }

  // Validazione per scene
  if (type === 'scenes') {
    if (!result || !Array.isArray(result.scenes) || result.scenes.length !== 3 ||
        !result.scenes.every(scene => 
          scene && 
          typeof scene.title === 'string' && scene.title.trim().length > 0 &&
          typeof scene.description === 'string' && scene.description.trim().length > 0
        )) {
      throw new Error('Invalid scenes format received from OpenAI');
    }
    return result;
  }

  // Validazione per preface e storeDescription
  if (type === 'preface' || type === 'storeDescription') {
    const field = type === 'preface' ? 'preface' : 'storeDescription';
    if (!result || !result[field] || typeof result[field] !== 'string' || 
        result[field].trim().length === 0) {
      throw new Error(`Invalid ${type} format received from OpenAI`);
    }
    return result;
  }

  // Se arriviamo qui, il tipo non è gestito
  throw new Error(`Unknown validation type: ${type}`);
};

const generateCategories = async (bookText) => {
  return withRetry(async () => {
    const truncatedText = truncateToTokenLimit(bookText, CONSTANTS.TOKEN_LIMIT, 'categories');
    
    const completion = await openai.chat.completions.create({
      model: CONSTANTS.MODEL,
      messages: [
        {
          role: "system",
          content: `Sei un esperto di categorizzazione libri secondo il sistema BISAC. 
                   Analizza attentamente il testo fornito e proponi tre categorie BISAC affini al contenuto.
                   Rispondi SOLO con un oggetto JSON contenente le categorie con questa struttura: 
                   {
                     "mainCategory": "CATEGORIA_PRINCIPALE",
                     "secondaryCategories": [
                       "CATEGORIA_SECONDARIA_1",
                       "CATEGORIA_SECONDARIA_2"
                     ]
                   }`
        },
        {
          role: "user",
          content: `Analizza questo libro e suggerisci tre categorie. Testo del libro: ${truncatedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const cleanResponse = cleanJsonResponse(completion.choices[0].message.content);
    const result = JSON.parse(cleanResponse);

    return validateResponse('categories', result);
  });
};

const generateKeywords = async (bookText) => {
  return withRetry(async () => {
    const truncatedText = truncateToTokenLimit(bookText, CONSTANTS.TOKEN_LIMIT, 'keywords');
    const completion = await openai.chat.completions.create({
      model: CONSTANTS.MODEL,
      messages: [
        {
          role: "system",
          content: `Sei un esperto SEO. Analizza il testo fornito e proponi sette parole chiave rilevanti rispetto al contenuto del libro.
                   Le keywords devono essere DIVERSE tra loro e pertinenti al contenuto del libro.
                   Rispondi SOLO con un oggetto JSON con questa struttura: 
                   {
                     "keywords": [
                       "KEYWORD_1",
                       "KEYWORD_2",
                       "KEYWORD_3",
                       "KEYWORD_4",
                       "KEYWORD_5",
                       "KEYWORD_6",
                       "KEYWORD_7"
                     ]
                   }`
        },
        {
          role: "user",
          content: `Analizza questo libro e suggerisci sette keywords diverse tra loro. Testo del libro: ${truncatedText}`
        }
      ],
      temperature: 1,
      max_tokens: 250
    });

    const cleanResponse = cleanJsonResponse(completion.choices[0].message.content);
    const result = JSON.parse(cleanResponse);

    return validateResponse('keywords', result);
  });
};

const generateScenes = async (bookText) => {
  return withRetry(async () => {
    const truncatedText = truncateToTokenLimit(bookText, CONSTANTS.TOKEN_LIMIT, 'scenes');
    const completion = await openai.chat.completions.create({
      model: CONSTANTS.MODEL,
      messages: [
        {
          role: "system",
          content: `Sei un esperto di design di copertine di libri. 
                   Analizza il testo e identifica 3 scene significative che potrebbero essere efficaci come copertina.
                   Le scene devono essere DIVERSE tra loro e visivamente d'impatto.
                   Rispondi SOLO con un oggetto JSON con questa struttura: 
                   {
                     "scenes": [
                       {
                         "title": "TITOLO_BREVE_SCENA",
                         "description": "DESCRIZIONE_DETTAGLIATA_PER_IMMAGINE"
                       },
                       {
                         "title": "TITOLO_BREVE_SCENA",
                         "description": "DESCRIZIONE_DETTAGLIATA_PER_IMMAGINE"
                       },
                       {
                         "title": "TITOLO_BREVE_SCENA",
                         "description": "DESCRIZIONE_DETTAGLIATA_PER_IMMAGINE"
                       }
                     ]
                   }`
        },
        {
          role: "user",
          content: `Analizza questo libro e suggerisci tre scene per la copertina. Testo del libro: ${truncatedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const cleanResponse = cleanJsonResponse(completion.choices[0].message.content);
    const result = JSON.parse(cleanResponse);

    return validateResponse('scenes', result);
  });
};

const generateCoverImage = async (sceneDescription) => {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: sceneDescription,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json"
    });

    return response.data[0].b64_json;
  } catch (error) {
    console.error('Error generating cover image:', error);
    handleOpenAIError(error);
  }
};

const generateBackCover = async (bookText) => {
  return withRetry(async () => {
    const truncatedText = truncateToTokenLimit(bookText, CONSTANTS.TOKEN_LIMIT, 'backcover');
    const completion = await openai.chat.completions.create({
      model: CONSTANTS.MODEL,
      messages: [
        {
          role: "system",
          content: `Sei un esperto copywriter specializzato in quarte di copertina. 
                   Analizza il testo e crea una quarta di copertina accattivante in italiano.
                   La quarta di copertina deve:
                   - Mettersi nei panni del lettore
                   - Essere concisa ed efficace
                   - Avere un incipit forte (domanda, scena, problema o promessa)
                   - Creare suspense e desiderio di leggere
                   Rispondi SOLO con un oggetto JSON con questa struttura:
                   {
                     "backCover": "TESTO_QUARTA_DI_COPERTINA"
                   }`
        },
        {
          role: "user",
          content: `Analizza questo libro e crea una quarta di copertina efficace. Testo del libro: ${truncatedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const cleanResponse = cleanJsonResponse(completion.choices[0].message.content);
    const result = JSON.parse(cleanResponse);

    return validateResponse('backCover', result);
  });
};

const generatePreface = async (bookText) => {
  return withRetry(async () => {
    const truncatedText = truncateToTokenLimit(bookText, CONSTANTS.TOKEN_LIMIT, 'preface');
    const completion = await openai.chat.completions.create({
      model: CONSTANTS.MODEL,
      messages: [
        {
          role: "system",
          content: `Sei un esperto editor specializzato nella scrittura di prefazioni.
                   Analizza il testo e crea una prefazione seguendo questa struttura:
                   - Introduzione al Tema Principale
                   - Descrizione dei temi Specifici Affrontati
                   - Tono e ruolo dell'autore, contesto e prospettive uniche
                   - Il messaggio chiave del libro
                   - Citazioni rilevanti dal testo
                   - Enfasi sull'Impatto Emotivo e Sociale
                   - Chiusura Motivazionale
                   
                   Usa uno stile:
                   - Descrittivo e Analitico
                   - Chiaro e Accessibile
                   - Motivazionale e Ispirazionale
                   - Focalizzato sui Benefici per il Lettore
                   - Diretto verso il lettore
                   - Evitando ripetizioni
                   
                   Rispondi SOLO con un oggetto JSON con questa struttura:
                   {
                     "preface": "TESTO_PREFAZIONE"
                   }`
        },
        {
          role: "user",
          content: `Analizza questo libro e crea una prefazione efficace. Testo del libro: ${truncatedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const cleanResponse = cleanJsonResponse(completion.choices[0].message.content);
    const result = JSON.parse(cleanResponse);

    return validateResponse('preface', result);
  });
};

const generateStoreDescription = async (bookText) => {
  return withRetry(async () => {
    const truncatedText = truncateToTokenLimit(bookText, CONSTANTS.TOKEN_LIMIT, 'store');
    const completion = await openai.chat.completions.create({
      model: CONSTANTS.MODEL,
      messages: [
        {
          role: "system",
          content: `Sei un esperto copywriter specializzato in descrizioni per store online.
                   Analizza il testo e crea una descrizione che:
                   - Sia semplice, avvincente e professionale
                   - Usi un linguaggio diretto e circostanziato
                   - Eviti parole come: immergersi, snodare, nel cuore di, attraverso, viaggio
                   - Si concentri solo sulla trama o idea principale
                   - Catturi l'attenzione con una prima frase d'impatto
                   - Indichi il genere del libro
                   - Sia grammaticalmente perfetta
                   
                   Rispondi SOLO con un oggetto JSON con questa struttura:
                   {
                     "storeDescription": "TESTO_DESCRIZIONE"
                   }`
        },
        {
          role: "user",
          content: `Analizza questo libro e crea una descrizione efficace per gli store online. Testo del libro: ${truncatedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const cleanResponse = cleanJsonResponse(completion.choices[0].message.content);
    const result = JSON.parse(cleanResponse);

    return validateResponse('storeDescription', result);
  });
};

const generateSynopsis = async (bookText) => {
  return withRetry(async () => {
    const truncatedText = truncateToTokenLimit(bookText, CONSTANTS.TOKEN_LIMIT, 'synopsis');
    const completion = await openai.chat.completions.create({
      model: CONSTANTS.MODEL,
      messages: [
        {
          role: "system",
          content: `Sei un editor professionista specializzato nella scrittura di sinossi.
                   Analizza il testo e crea una sinossi che:
                   - Catturi l'essenza della storia
                   - Sia coinvolgente e ben scritta
                   - Abbia una lunghezza tra 200-300 parole
                   - Eviti spoiler importanti
                   - Mantenga il tono del libro
                   
                   Rispondi SOLO con un oggetto JSON con questa struttura:
                   {
                     "synopsis": "TESTO_SINOSSI"
                   }`
        },
        {
          role: "user",
          content: `Analizza questo libro e crea una sinossi efficace. Testo del libro: ${truncatedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const cleanResponse = cleanJsonResponse(completion.choices[0].message.content);
    const result = JSON.parse(cleanResponse);

    return validateResponse('synopsis', result);
  });
};

module.exports = {
  generateCategories,
  generateKeywords,
  generateScenes,
  generateCoverImage,
  generateBackCover,
  generatePreface,
  generateStoreDescription,
  generateSynopsis
}; 