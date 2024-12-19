const OpenAI = require('openai');
const { encoding_for_model } = require('@dqbd/tiktoken');
const { validators } = require('../utils/validators');
const { processRollingSummary, prepareChunksForProcessing } = require('../utils/chunkingUtils');

// Costanti di configurazione
const CONSTANTS = {
  MODEL: 'gpt-4o-mini',
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,
  }
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const logGeneration = (type, tokens) => {
  console.log(`[${type.toUpperCase()}] Generation stats:`);
  console.log(`- Tokens processed: ${tokens}`);
  console.log(`- Model: ${CONSTANTS.MODEL}`);
  console.log('-------------------');
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

const generateCategories = async (bookContent) => {
  return withRetry(async () => {
    const { chunks } = bookContent;
    
    // Prepara i chunks e verifica che siano validi
    const preparedChunks = prepareChunksForProcessing(chunks, 'categories');
    
    // Generiamo il rolling summary per il contesto generale
    const summary = await processRollingSummary(preparedChunks);
    
    console.log('Rolling Summary Stats:', {
      originalChunks: preparedChunks.length,
      summaryLength: summary.summaryText.length,
      processedChunks: summary.processedChunks
    });

    // Array per raccogliere tutte le categorie suggerite
    let allCategories = [];
    
    // Processa ogni chunk individualmente
    for (const chunk of preparedChunks) {
      const completion = await openai.chat.completions.create({
        model: CONSTANTS.MODEL,
        messages: [
          {
            role: "system",
            content: `Sei un esperto di categorizzazione libri secondo il sistema BISAC. 
                     Analizza attentamente il testo fornito e proponi tre categorie BISAC in italiano affini al contenuto.
                     Considera anche il contesto generale del libro fornito nel summary.
                     Scrivi le categorie solo in italiano che rispettano il sistema BISAC come in questo esempio: FICTION / Fantasy / Generale.
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
            content: `Contesto generale del libro:\n${summary.summaryText}\n\nAnalizza questa parte specifica e suggerisci tre categorie.\n\nContenuto:\n${chunk.text}`
          }
        ],
        temperature: 0.4,
        max_tokens: 150
      });

      const cleanResponse = cleanJsonResponse(completion.choices[0].message.content);
      const result = JSON.parse(cleanResponse);
      allCategories.push(result);
    }

    // Analizza tutte le categorie suggerite e scegli le più frequenti
    const finalCategories = combineCategories(allCategories);
    
    return validateResponse('categories', finalCategories);
  });
};

// Funzione helper per combinare le categorie
const combineCategories = (categoriesList) => {
  // Conta la frequenza di ogni categoria
  const categoryCount = {};
  
  categoriesList.forEach(cat => {
    // Conta la categoria principale
    categoryCount[cat.mainCategory] = (categoryCount[cat.mainCategory] || 0) + 2; // peso maggiore
    
    // Conta le categorie secondarie
    cat.secondaryCategories.forEach(secCat => {
      categoryCount[secCat] = (categoryCount[secCat] || 0) + 1;
    });
  });
  
  // Ordina le categorie per frequenza
  const sortedCategories = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .map(([category]) => category);
  
  return {
    mainCategory: sortedCategories[0],
    secondaryCategories: [
      sortedCategories[1],
      sortedCategories[2]
    ]
  };
};

const generateKeywords = async (bookContent) => {
  return withRetry(async () => {
    const { chunks } = bookContent;
    
    // Prepara i chunks e verifica che siano validi
    const preparedChunks = prepareChunksForProcessing(chunks, 'keywords');
    
    // Generiamo il rolling summary per il contesto generale
    const summary = await processRollingSummary(preparedChunks);
    
    console.log('Rolling Summary Stats:', {
      originalChunks: preparedChunks.length,
      summaryLength: summary.summaryText.length,
      processedChunks: summary.processedChunks
    });

    // Array per raccogliere tutte le keywords suggerite
    let allKeywords = [];
    
    // Processa ogni chunk individualmente
    for (const chunk of preparedChunks) {
      const completion = await openai.chat.completions.create({
        model: CONSTANTS.MODEL,
        messages: [
          {
            role: "system",
            content: `Sei un esperto SEO. Analizza il testo fornito e proponi sette parole chiave rilevanti rispetto al contenuto del libro.
                     Le keywords devono essere DIVERSE tra loro e pertinenti al contenuto del libro e iniziare TUTTE con la LETTERA MAIUSCOLA.
                     Considera anche il contesto generale del libro fornito nel summary.
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
            content: `Contesto generale del libro:\n${summary.summaryText}\n\nAnalizza questa parte specifica e suggerisci keywords.\n\nContenuto:\n${chunk.text}`
          }
        ],
        temperature: 1,
        max_tokens: 250
      });

      const cleanResponse = cleanJsonResponse(completion.choices[0].message.content);
      const result = JSON.parse(cleanResponse);
      allKeywords.push(result);
    }

    // Combina e seleziona le keywords più rilevanti
    const finalKeywords = combineKeywords(allKeywords);
    
    return validateResponse('keywords', finalKeywords);
  });
};

// Funzione helper per combinare le keywords
const combineKeywords = (keywordsList) => {
  // Conta la frequenza di ogni keyword
  const keywordCount = {};
  
  keywordsList.forEach(result => {
    result.keywords.forEach(keyword => {
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
    });
  });
  
  // Ordina le keywords per frequenza e prendi le top 7
  const topKeywords = Object.entries(keywordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 7)
    .map(([keyword]) => keyword);
  
  return {
    keywords: topKeywords
  };
};

const generateScenes = async (bookContent) => {
  return withRetry(async () => {
    const { chunks } = bookContent;
    
    // Prepara i chunks e verifica che siano validi
    const preparedChunks = prepareChunksForProcessing(chunks, 'scenes');
    
    // Generiamo il rolling summary per il contesto generale
    const summary = await processRollingSummary(preparedChunks);
    
    console.log('Rolling Summary Stats:', {
      originalChunks: preparedChunks.length,
      summaryLength: summary.summaryText.length,
      processedChunks: summary.processedChunks
    });

    // Per le scene usiamo solo il summary perché vogliamo una visione d'insieme
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
          content: `Analizza questo libro e suggerisci tre scene per la copertina. Testo del libro: ${summary.summaryText}`
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

const generateBackCover = async (bookContent) => {
  return withRetry(async () => {
    const { chunks } = bookContent;
    
    // Prepara i chunks e verifica che siano validi
    const preparedChunks = prepareChunksForProcessing(chunks, 'backcover');
    
    // Generiamo il rolling summary per il contesto generale
    const summary = await processRollingSummary(preparedChunks);
    
    console.log('Rolling Summary Stats:', {
      originalChunks: preparedChunks.length,
      summaryLength: summary.summaryText.length,
      processedChunks: summary.processedChunks
    });

    // Per la quarta di copertina usiamo solo il summary perché vogliamo una visione d'insieme
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
          content: `Analizza questo libro e crea una quarta di copertina efficace. Testo del libro: ${summary.summaryText}`
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

const generatePreface = async (bookContent) => {
  return withRetry(async () => {
    const { chunks } = bookContent;
    
    // Prepara i chunks e verifica che siano validi
    const preparedChunks = prepareChunksForProcessing(chunks, 'preface');
    
    // Generiamo il rolling summary per il contesto generale
    const summary = await processRollingSummary(preparedChunks);
    
    console.log('Rolling Summary Stats:', {
      originalChunks: preparedChunks.length,
      summaryLength: summary.summaryText.length,
      processedChunks: summary.processedChunks
    });

    const completion = await openai.chat.completions.create({
      model: CONSTANTS.MODEL,
      messages: [
        {
          role: "system",
          content: `Sei un esperto editor e copywriter specializzato nella scrittura di prefazioni.
                   Analizza il testo e crea una prefazione seguendo questa struttura:
                   - Introduzione al Tema Principale
                   - Descrizione dei temi Specifici Affrontati
                   - Tono e ruolo dell'autore, contesto e prospettive uniche
                   - Il messaggio chiave del libro
                   - Enfasi sull'Impatto Emotivo e Sociale
                   - Chiusura Motivazionale
                   
                   Usa uno stile:
                   - Descrittivo e Analitico
                   - Chiaro e Accessibile
                   - Motivazionale e Ispirazionale
                   - Focalizzato sui Benefici per il Lettore
                   - Se ti trovi a ripetere parole, utilizza sinonimi
                   
                   Rispondi SOLO con un oggetto JSON con questa struttura:
                   {
                     "preface": "TESTO_PREFAZIONE"
                   }`
        },
        {
          role: "user",
          content: `Analizza questo libro e crea una prefazione efficace. Testo del libro: ${summary.summaryText}`
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

const generateStoreDescription = async (bookContent) => {
  return withRetry(async () => {
    const { chunks } = bookContent;
    
    // Prepara i chunks e verifica che siano validi
    const preparedChunks = prepareChunksForProcessing(chunks, 'store');
    
    // Generiamo il rolling summary per il contesto generale
    const summary = await processRollingSummary(preparedChunks);
    
    console.log('Rolling Summary Stats:', {
      originalChunks: preparedChunks.length,
      summaryLength: summary.summaryText.length,
      processedChunks: summary.processedChunks
    });

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
          content: `Analizza questo libro e crea una descrizione efficace per gli store online. Testo del libro: ${summary.summaryText}`
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

const generateSynopsis = async (bookContent) => {
  return withRetry(async () => {
    const { chunks } = bookContent;
    
    // Prepara i chunks e verifica che siano validi
    const preparedChunks = prepareChunksForProcessing(chunks, 'synopsis');
    
    // Generiamo il rolling summary per il contesto generale
    const summary = await processRollingSummary(preparedChunks);
    
    console.log('Rolling Summary Stats:', {
      originalChunks: preparedChunks.length,
      summaryLength: summary.summaryText.length,
      processedChunks: summary.processedChunks
    });

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
          content: `Analizza questo libro e crea una sinossi efficace. Testo del libro: ${summary.summaryText}`
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

async function suggestBisacCodes(bookDescription) {
    const bisacService = require('./bisac.service');
    
    // Prima chiediamo a GPT di generare parole chiave per la ricerca
    const keywordsResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
            role: "system",
            content: "Sei un esperto di classificazione libri. Data una descrizione del libro, genera 3-5 parole chiave rilevanti per la ricerca di codici BISAC."
        }, {
            role: "user",
            content: bookDescription
        }],
        temperature: 0.7
    });

    const keywords = keywordsResponse.choices[0].message.content;
    
    // Cerca i codici BISAC pertinenti nel database
    const relevantCodes = await bisacService.searchBisacCodes(keywords);
    
    // Ora chiedi a GPT di selezionare i codici più appropriati
    const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
            role: "system",
            content: "Seleziona i codici BISAC più appropriati dalla lista fornita per questo libro."
        }, {
            role: "user",
            content: `Descrizione libro: ${bookDescription}\n\nCodici BISAC disponibili:\n${JSON.stringify(relevantCodes, null, 2)}`
        }],
        temperature: 0.7
    });

    return finalResponse.choices[0].message.content;
}

module.exports = {
  generateCategories,
  generateKeywords,
  generateScenes,
  generateCoverImage,
  generateBackCover,
  generatePreface,
  generateStoreDescription,
  generateSynopsis,
  suggestBisacCodes
}; 