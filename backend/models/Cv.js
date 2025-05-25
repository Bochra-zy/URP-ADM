const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  nomFichier: { 
    type: String,
     required: true 
},
  candidat: {
     type: mongoose.Schema.Types.ObjectId, ref: 'User',
      required: true 
    },
 dateDepot: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('CV', cvSchema);