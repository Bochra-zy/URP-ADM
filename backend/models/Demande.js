// models/Demande.js
const mongoose = require('mongoose');

const DemandeSchema = new mongoose.Schema({
  candidat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Un candidat est requis pour la demande'],
  },
  offre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offre',
    required: [true, 'Une offre est requise pour la demande'],
  },
  statut: {
    type: String,
    enum: ['en attente', 'acceptée', 'refusée'],
    default: 'en attente',
  },
  dateDemande: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt:{
    type: Date,
    default: Date.now,
  }
});

// Update hasDemandes in User when a demand is created or deleted
DemandeSchema.post('save', async function (doc) {
  await mongoose.model('User').updateOne(
    { _id: doc.candidat },
    { hasDemandes: true }
  );
});

DemandeSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  const demandesCount = await mongoose.model('Demande').countDocuments({ candidat: doc.candidat });
  await mongoose.model('User').updateOne(
    { _id: doc.candidat },
    { hasDemandes: demandesCount > 0 }
  );
});

module.exports = mongoose.model('Demande', DemandeSchema);