const mongoose = require('mongoose');

const validators = {
  isValidObjectId: (id) => mongoose.Types.ObjectId.isValid(id),
  
  isValidExtractedText: (text) => {
    return typeof text === 'string' && text.trim().length > 0;
  },

  categories: {
    validateResult: (result) => {
      return result && 
             result.mainCategory && 
             Array.isArray(result.secondaryCategories) && 
             result.secondaryCategories.length === 2;
    }
  },

  keywords: {
    validateResult: (result) => {
      return result && 
             Array.isArray(result.keywords) && 
             result.keywords.length === 7 &&
             result.keywords.every(k => typeof k === 'string' && k.trim());
    }
  },

  scenes: {
    validateScenes: (scenes) => {
      return Array.isArray(scenes) && 
             scenes.length === 3 &&
             scenes.every(s => s.title && s.description);
    }
  },

  backCover: {
    validateResult: (result) => {
      return result &&
             typeof result.backCover === 'string' && 
             result.backCover.trim().length > 0;
    }
  },

  preface: {
    validateResult: (result) => {
      return result &&
             typeof result.preface === 'string' &&
             result.preface.trim().length > 0;
    }
  },

  storeDescription: {
    validateResult: (result) => {
      return result &&
             typeof result.storeDescription === 'string' &&
             result.storeDescription.trim().length > 0;
    }
  },

  synopsis: {
    validateResult: (result) => {
      return result && 
             typeof result === 'object' && 
             typeof result.synopsis === 'string' && 
             result.synopsis.length >= 100;
    }
  }
};

module.exports = {
  validators
}; 