const mongoose = require("mongoose");

const InterviewSchema = new mongoose.Schema({
  candidat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Un candidat est requis pour l'entretien"],
  },
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Un responsable est requis pour l'entretien"],
  },
  offre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offre",
    required: [true, "Une offre est requise pour l'entretien"],
  },
  date: {
    type: Date,
    required: [true, "La date de l'entretien est requise"],
  },
  dure: {
    type: Number, // Duration in minutes
    required: true,
    default: 30,
  },
   statut: {
    type: String,
    enum: ['planifié', 'terminé', 'annulé'],
    default: 'planifié'
  },
  decision: {
    type: String,
    enum: ['accepter', 'refuser'],    
    default: null 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  meetingLink: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("Interviews", InterviewSchema);