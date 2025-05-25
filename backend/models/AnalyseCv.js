const mongoose = require('mongoose');

const analyseSchema = new mongoose.Schema({
  cv: {
   type: mongoose.Schema.Types.ObjectId, 
   ref: 'CV', 
   required: true
   },
  responsable: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true },
  dateAnalyse: {
     type: Date,
      required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Analyse', analyseSchema);