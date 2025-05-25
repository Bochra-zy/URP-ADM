const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['candidat', 'responsable', 'admin'], 
    },
    specialite: {
        type: String,
       required: [
      function() { return this.role === 'responsable' || this.role === 'candidat'; },
      'La spécialité est requise pour les responsables et candidats'
    ],
    },
    // Champs spécifiques à Candidat
    experience: {
        type: String,
        required: function () {
            return this.role === 'candidat' ;
        },
        default: null,
    },
    tel: {
        type: String,
        required: false,
        default: null,
    },
    // Champs spécifiques à Responsable
    nom_entreprise: {
        type: String,
        required: function () {
            return this.role === 'responsable';
        },
        default: null,
    },
    adresse_entreprise: {
        type: String,
        required: function () {
            return this.role === 'responsable';
        },
        default: null,
    },
    status: {
        type: String,
        enum: ['à la recherche', 'employé', 'en attente'],
        required: function () {
            return this.role === 'candidat';
        },
        default: function () {
            return this.role === 'candidat' ? 'à la recherche' : null;
        },
    },
}, {
    collection: 'users',
});

// Hachage du mot de passe avant sauvegarde
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Méthode pour comparer le mot de passe
UserSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;