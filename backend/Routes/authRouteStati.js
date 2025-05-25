// routes/authRouteStati.js
const express = require('express');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const router = express.Router();

// Import models (adjust paths as needed)
const Responsable = require('../models/User');
const Candidat = require('../models/User');
const Offre = require('../models/Offres'); 
const Demande = require('../models/Demande');
const Interview = require('../models/Interview');
const User = require ('../models/User');
// Define JWT_SECRET (preferably from .env)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète';

// Middleware pour vérifier le token JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Aucun token fourni' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

// Endpoints pour les statistiques
router.get('/responsables', authMiddleware, async (req, res) => {
  try {
    const responsables = await User.countDocuments({ role: 'responsable' });
    res.json({ responsables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/offres', authMiddleware, async (req, res) => {
  try {
    const offres = await Offre.countDocuments();
    res.json({ offres });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/candidats', authMiddleware, async (req, res) => {
  try {
    const candidats = await User.countDocuments({ role: 'candidat' });
    res.json({ candidats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/demandes-acceptees', authMiddleware, async (req, res) => {
  try {
    const demandesAcceptees = await Demande.countDocuments({ status: 'accepted' });
    res.json({ demandesAcceptees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/interviews-accepted', authMiddleware, async (req, res) => {
  try {
    const interviewsAccepted = await Interview.countDocuments({ decision: 'accepted' });
    res.json({ interviewsAccepted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/interviews-not-accepted', authMiddleware, async (req, res) => {
  try {
    const interviewsNotAccepted = await Interview.countDocuments({ decision: 'rejected' });
    res.json({ interviewsNotAccepted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/interviews', authMiddleware, async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate('candidat', 'prenom nom')
      .populate('responsable', 'prenom nom_entreprise');
    res.json(interviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;