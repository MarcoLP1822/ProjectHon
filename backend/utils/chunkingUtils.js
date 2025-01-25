const { encoding_for_model } = require('@dqbd/tiktoken');
const { ValidationError } = require('./errors');

const CHUNK_CONSTANTS = {
  // Limiti per i token
  MAX_TOKENS_PER_CHUNK: 6000,
  MIN_TOKENS_PER_CHUNK: 1000,
  OVERLAP_TOKENS: 500,
  
  // Delimitatori naturali del testo, in ordine di priorità
  DELIMITERS: {
    CHAPTER: /Chapter \d+|Capitolo \d+/gi,
    SECTION: /\n\s*§\s*\d+|\n\s*Sezione\s+\d+/gi,
    PARAGRAPH: /\n\s*\n/g,
  },
  
  // Configurazione per il rolling summary
  SUMMARY: {
    MAX_LENGTH: 6000,
    MIN_LENGTH: 2000,
  },

  // Aggiungi questa nuova configurazione
  PROCESSING: {
    MAX_TOKENS_FOR_REQUEST: 120000, // ~90% del limite massimo di GPT-4
    MAX_TOKENS_FOR_SUMMARY: 80000,  // Per il summary possiamo usare meno token
  }
};

/**
 * Identifica la struttura naturale del testo (capitoli, sezioni, ecc)
 * @param {string} text - Il testo completo da analizzare
 * @returns {Object} Struttura identificata con metadati
 */
const identifyStructure = (text) => {
  if (!text) {
    throw new ValidationError('Text is required for structure identification');
  }

  const structure = {
    hasChapters: false,
    hasSections: false,
    totalParagraphs: 0,
    chapterMatches: [],
    sectionMatches: [],
  };

  // Identifica capitoli
  const chapterMatches = [...text.matchAll(CHUNK_CONSTANTS.DELIMITERS.CHAPTER)];
  if (chapterMatches.length > 0) {
    structure.hasChapters = true;
    structure.chapterMatches = chapterMatches.map(match => ({
      index: match.index,
      title: match[0]
    }));
  }

  // Identifica sezioni
  const sectionMatches = [...text.matchAll(CHUNK_CONSTANTS.DELIMITERS.SECTION)];
  if (sectionMatches.length > 0) {
    structure.hasSections = true;
    structure.sectionMatches = sectionMatches.map(match => ({
      index: match.index,
      title: match[0]
    }));
  }

  // Conta paragrafi
  const paragraphMatches = text.match(CHUNK_CONSTANTS.DELIMITERS.PARAGRAPH);
  structure.totalParagraphs = paragraphMatches ? paragraphMatches.length : 0;

  return structure;
};

/**
 * Divide il testo in chunks basandosi sulla struttura identificata
 * @param {string} text - Testo da dividere in chunks
 * @param {Object} structure - Struttura identificata del testo
 * @returns {Array<Object>} Array di chunks con metadati
 */
const createChunks = (text, structure) => {
  if (!text) {
    throw new ValidationError('Text is required for chunking');
  }

  const chunks = [];
  const enc = encoding_for_model('gpt-4o-mini');

  try {
    if (structure.hasChapters) {
      // Dividi per capitoli
      return createChapterBasedChunks(text, structure.chapterMatches, enc);
    } else if (structure.hasSections) {
      // Dividi per sezioni
      return createSectionBasedChunks(text, structure.sectionMatches, enc);
    } else {
      // Dividi per tokens con overlap
      return createTokenBasedChunks(text, enc);
    }
  } finally {
    enc.free();
  }
};

/**
 * Crea chunks basati sui capitoli
 * @private
 */
const createChapterBasedChunks = (text, chapterMatches, encoder) => {
  const chunks = [];
  
  for (let i = 0; i < chapterMatches.length; i++) {
    const currentChapter = chapterMatches[i];
    const nextChapter = chapterMatches[i + 1];
    
    const startIndex = currentChapter.index;
    const endIndex = nextChapter ? nextChapter.index : text.length;
    
    const chapterText = text.slice(startIndex, endIndex);
    const tokens = encoder.encode(chapterText);
    
    if (tokens.length > CHUNK_CONSTANTS.MAX_TOKENS_PER_CHUNK) {
      // Se il capitolo è troppo grande, dividiamolo ulteriormente
      const subChunks = createTokenBasedChunks(chapterText, encoder);
      subChunks.forEach((subChunk, index) => {
        chunks.push({
          ...subChunk,
          chapterTitle: currentChapter.title,
          isSubChunk: true,
          subChunkIndex: index
        });
      });
    } else {
      chunks.push({
        text: chapterText,
        tokens: tokens.length,
        chapterTitle: currentChapter.title,
        isSubChunk: false
      });
    }
  }
  
  return chunks;
};

/**
 * Crea chunks basati sui token con overlap
 * @private
 */
const createTokenBasedChunks = (text, encoder) => {
  const chunks = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // Prendiamo una porzione di testo
    const chunkText = text.slice(
      currentIndex, 
      currentIndex + CHUNK_CONSTANTS.MAX_TOKENS_PER_CHUNK * 4
    );
    const chunkTokens = encoder.encode(chunkText).length;
    
    chunks.push({
      text: chunkText,
      tokens: chunkTokens,
      startIndex: currentIndex,
      endIndex: currentIndex + chunkText.length
    });
    
    // Avanziamo considerando l'overlap
    currentIndex += (CHUNK_CONSTANTS.MAX_TOKENS_PER_CHUNK - CHUNK_CONSTANTS.OVERLAP_TOKENS) * 4;
  }
  
  return chunks;
};

/**
 * Crea chunks basati sulle sezioni
 * @private
 */
const createSectionBasedChunks = (text, sectionMatches, encoder) => {
  const chunks = [];
  
  for (let i = 0; i < sectionMatches.length; i++) {
    const currentSection = sectionMatches[i];
    const nextSection = sectionMatches[i + 1];
    
    const startIndex = currentSection.index;
    const endIndex = nextSection ? nextSection.index : text.length;
    
    const sectionText = text.slice(startIndex, endIndex);
    const tokens = encoder.encode(sectionText);
    
    if (tokens.length > CHUNK_CONSTANTS.MAX_TOKENS_PER_CHUNK) {
      // Se la sezione è troppo grande, dividiamola ulteriormente
      const subChunks = createTokenBasedChunks(sectionText, encoder);
      subChunks.forEach((subChunk, index) => {
        chunks.push({
          ...subChunk,
          sectionTitle: currentSection.title,
          isSubChunk: true,
          subChunkIndex: index
        });
      });
    } else {
      chunks.push({
        text: sectionText,
        tokens: tokens.length,
        sectionTitle: currentSection.title,
        isSubChunk: false
      });
    }
  }
  
  return chunks;
};

/**
 * Gestisce il rolling summary dei chunks
 * @param {Array<Object>} chunks - Array di chunks da processare
 * @returns {string} Nuovo summary aggiornato
 */
const processRollingSummary = async (chunks) => {
  if (!chunks || chunks.length === 0) {
    throw new ValidationError('Chunks array is required for rolling summary');
  }

  // Concatena il testo di tutti i chunks
  let summaryText = chunks.map(chunk => {
    return typeof chunk === 'object' && chunk.text ? chunk.text : chunk;
  }).join('\n\n');

  // Limita la lunghezza del summary
  const maxChars = CHUNK_CONSTANTS.SUMMARY.MAX_LENGTH;
  if (summaryText.length > maxChars) {
    // Prendi l'inizio, la parte centrale e la fine del testo
    const partLength = Math.floor(maxChars / 3);
    summaryText = 
      summaryText.substring(0, partLength) + 
      '\n...[contenuto intermedio omesso]...\n' +
      summaryText.substring(summaryText.length - partLength, summaryText.length);
  }

  // Log per debugging
  console.log('Rolling Summary Stats:', {
    originalChunks: chunks.length,
    originalLength: summaryText.length,
    finalLength: summaryText.length,
    preview: summaryText.substring(0, 200)
  });

  return {
    summaryText,
    processedChunks: chunks.length,
    totalTokens: Math.ceil(summaryText.length / 4) // Stima approssimativa
  };
};

function prepareChunksForProcessing(chunks, type) {
  // Aggiungi validazione
  if (!chunks || !Array.isArray(chunks)) {
    console.error('Invalid chunks provided:', chunks);
    throw new Error('Invalid chunks format');
  }

  // Debug log per vedere la struttura esatta dei chunks
  console.log('First chunk structure:', {
    type: typeof chunks[0],
    isObject: typeof chunks[0] === 'object',
    hasText: chunks[0]?.text !== undefined,
    keys: chunks[0] ? Object.keys(chunks[0]) : [],
    sample: chunks[0]
  });

  // Aggiungi log per debugging
  console.log(`Preparing chunks for ${type}:`, {
    numChunks: chunks.length,
    totalLength: chunks.reduce((acc, chunk) => {
      // Debug log per ogni chunk
      console.log('Chunk type:', typeof chunk, 'Has text:', !!chunk.text);
      return acc + (chunk.text?.length || 0);
    }, 0),
    sampleChunk: chunks[0]?.text || 'No text available'
  });

  return chunks;
}

const limitChunksSize = (chunks, maxTokens = CHUNK_CONSTANTS.PROCESSING.MAX_TOKENS_FOR_REQUEST) => {
  if (!chunks || !Array.isArray(chunks)) {
    return [];
  }

  const enc = encoding_for_model('gpt-4o-mini');
  let totalTokens = 0;
  const limitedChunks = [];

  try {
    for (const chunk of chunks) {
      const chunkText = typeof chunk === 'object' ? chunk.text : chunk;
      const tokens = enc.encode(chunkText).length;
      
      // Aggiungi log per debugging
      console.log('Processing chunk:', {
        chunkLength: chunkText.length,
        tokens: tokens,
        totalTokensSoFar: totalTokens,
        maxTokens: maxTokens
      });
      
      if (totalTokens + tokens > maxTokens) {
        console.log('Reached token limit, stopping at', totalTokens, 'tokens');
        break;
      }
      
      limitedChunks.push(chunk);
      totalTokens += tokens;
    }

    // Log finale
    console.log('Final chunks stats:', {
      originalChunks: chunks.length,
      limitedChunks: limitedChunks.length,
      totalTokens: totalTokens,
      maxTokens: maxTokens
    });
  } finally {
    enc.free();
  }

  return limitedChunks;
};

module.exports = {
  CHUNK_CONSTANTS,
  identifyStructure,
  createChunks,
  processRollingSummary,
  prepareChunksForProcessing,
  limitChunksSize,
  createSectionBasedChunks
};