// models/Offre.js
const mongoose = require('mongoose');

const OffreSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre de l\'offre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères'],
  },
 typeContrat: {
    type: String,
    required: [true, 'Le type de contrat est requis'],
    enum: ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'],
    trim: true
  },
  salaire: {
    type: String,
    trim: true,
    maxlength: [50, 'Le salaire ne peut pas dépasser 50 caractères'],
  },
   statut: {
    type: String,
    enum: ['active', 'clôturé', 'inactif'],
    default: 'active'
  },
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Un responsable est requis pour l\'offre'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Offre', OffreSchema);