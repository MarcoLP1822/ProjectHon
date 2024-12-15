const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  text: String,
  tokens: Number,
  startIndex: Number,
  endIndex: Number,
  chapterTitle: String,
  isSubChunk: Boolean,
  subChunkIndex: Number
});

const structureSchema = new mongoose.Schema({
  hasChapters: Boolean,
  hasSections: Boolean,
  totalParagraphs: Number,
  chapterMatches: [{
    index: Number,
    title: String
  }],
  sectionMatches: [{
    index: Number,
    title: String
  }]
});

const bookSchema = new mongoose.Schema({
  title: String,
  filePath: String,
  uploadDate: { type: Date, default: Date.now },
  extractedText: String,
  lastTextExtraction: Date,
  chunks: [chunkSchema],
  structure: structureSchema,
  metadata: {
    categories: {
      mainCategory: String,
      secondaryCategories: [String]
    },
    keywords: [String],
    covers: {
      scenes: [{
        title: String,
        description: String,
        imageData: Buffer,
        imageContentType: String
      }],
      selectedScene: Number
    },
    backCover: String,
    preface: String,
    storeDescription: String,
    synopsis: {
      type: String,
      trim: true
    }
  }
});

module.exports = mongoose.model('Book', bookSchema); 