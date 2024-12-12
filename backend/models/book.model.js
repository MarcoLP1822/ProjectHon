const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,
  filePath: String,
  date: { type: Date, default: Date.now },
  extractedText: String,
  lastTextExtraction: Date,
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