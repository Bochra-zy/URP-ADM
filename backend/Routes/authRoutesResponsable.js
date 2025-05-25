const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CV = require('../models/Cv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const validator = require('validator');
const Offre = require('../models/Offres');
const Demande = require('../models/Demande');

// Define JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète';
// Middleware pour vérifier le token JWT et le rôle
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Aucun token fourni' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    // Vérifier le rôle
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'responsable') {
      return res.status(403).json({ message: 'Accès réservé aux responsable' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};
// POST /api/auth/responsable/register - Register a new responsable
router.post('/register', async (req, res) => {
  const { nom, prenom, email,password,specialite,experience,nom_entreprise,adresse_entreprise, tel } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Cet email est déjà utilisé' });

    user = new User({
      nom,
      prenom,
      specialite,
      email,
      password,
      role: 'responsable',
      experience: experience || null,
      tel: tel || null,
      nom_entreprise,
      adresse_entreprise,
    });

    await user.save();
    res.status(201).json({ message: 'Inscription réussie' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/auth/responsable/login - Login a responsable
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const foundUser = await User.findOne({ email, role: 'responsable' });
    if (!foundUser) return res.status(400).json({ message: 'Email invalide' });

    const isMatch = await foundUser.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe invalide' });

    const token = jwt.sign({ id: foundUser._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: 'Connexion réussie' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.get('/profil', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
// PUT /api/auth/responsable/profil - Update responsable profile
router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const { nom, prenom, email, password, nom_entreprise, adresse_entreprise } = req.body;

    // Validate inputs
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Adresse email invalide' });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    if (nom && !nom.trim()) {
      return res.status(400).json({ message: 'Le nom ne peut pas être vide' });
    }
    if (prenom && !prenom.trim()) {
      return res.status(400).json({ message: 'Le prénom ne peut pas être vide' });
    }

    // Prepare update object
    const updateData = {};
    if (nom) updateData.nom = nom.trim();
    if (prenom) updateData.prenom = prenom.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (nom_entreprise !== undefined) updateData.nom_entreprise = nom_entreprise.trim();
    if (adresse_entreprise !== undefined) updateData.adresse_entreprise = adresse_entreprise.trim();
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Check for email uniqueness (excluding current user)
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    console.log(`[PUT /responsable/profil] Profil mis à jour pour l'utilisateur ${req.user.id}`);
    res.json(updatedUser);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Cet email est déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
});

// GET /api/auth/responsable/candidats - Fetch candidates who applied to the recruiter's offers
router.get('/candidats', authMiddleware, async (req, res) => {
  try {
    const offres = await Offre.find({ responsable: req.user.id }).select('_id');
    const offreIds = offres.map(offre => offre._id);
    const demandes = await Demande.find({ offre: { $in: offreIds } })
      .populate('candidat', 'nom prenom email')
      .lean();
    
    const candidates = [...new Map(demandes.map(d => [d.candidat._id, d.candidat])).values()];
    
    res.json(candidates);
  } catch (error) {
    console.error('Erreur lors de la récupération des candidats:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;