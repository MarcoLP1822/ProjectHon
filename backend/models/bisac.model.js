const mongoose = require('mongoose');

const bisacSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        index: 'text'
    },
    description: {
        type: String,
        index: 'text'
    },
    parent: {
        type: String,
        index: true
    }
}, { timestamps: true });

// Indice composto per ricerca full-text
bisacSchema.index({ title: 'text', description: 'text' });

const Bisac = mongoose.model('Bisac', bisacSchema);

module.exports = Bisac; 