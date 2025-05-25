const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CV = require('../models/Cv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const validator = require('validator');



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
    if (!user || user.role !== 'candidat') {
      return res.status(403).json({ message: 'Accès réservé aux candidats' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};
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

// PUT /api/auth/candidat/profil - Update candidate profile
router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const { nom, prenom, email, password, experience, status } = req.body;

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
    if (experience !== undefined) updateData.experience = experience.trim();
    if (status !== undefined) updateData.status = status.trim();
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

    console.log(`[PUT /candidat/profil] Profil mis à jour pour l'utilisateur ${req.user.id}`);
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
// Configure multer for CV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
    }
  },
});

// POST /api/auth/candidat/register - Register a new candidate
router.post('/register', async (req, res) => {
  const { nom, prenom, specialite, email, password, experience, tel } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Cet email est déjà utilisé' });

    user = new User({
      nom,
      prenom,
      specialite,
      email,
      password,
      role: 'candidat',
      experience: experience || null,
      tel: tel || null,
      status: 'à la recherche',
      hasDemandes: false,
    });

    await user.save();
    res.status(201).json({ message: 'Inscription réussie' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/auth/candidat/login - Login a candidate
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const foundUser = await User.findOne({ email, role: 'candidat' });
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

// POST /api/auth/candidat/upload-cv/:id - Upload CV for a candidate
router.post('/upload-cv/:id', authMiddleware, upload.single('cv'), async (req, res) => {
  try {
    const candidat = await User.findById(req.params.id);
    if (!candidat) {
      return res.status(404).json({ message: 'Candidat non trouvé' });
    }
    if (candidat._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que votre propre CV' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    // Delete existing CV if any
    await CV.deleteOne({ candidat: req.params.id });

    // Create new CV document
    const newCV = new CV({
      nomFichier: req.file.filename,
      chemin: `/Uploads/${req.file.filename}`,
      candidat: req.params.id,
    });

    await newCV.save();
    res.json({ message: 'CV téléchargé avec succès', cv: { nomFichier: newCV.nomFichier, chemin: newCV.chemin } });
  } catch (error) {
    console.error('Erreur lors du téléchargement du CV:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/auth/candidat/profil - Fetch candidate profile
router.get('/profil', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('nom prenom email specialite experience tel status');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      specialite: user.specialite || null,
      experience: user.experience || null,
      tel: user.tel || null,
      status: user.status || null
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Middleware to ensure the user is a recruiter (responsable)
const responsableMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Aucun token fourni' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'responsable') {
      return res.status(403).json({ message: 'Accès réservé aux recruteurs' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};
// GET /api/auth/candidat/candidatesCV - Fetch all candidates with CV details
router.get('/candidatesCV', responsableMiddleware, async (req, res) => {
  try {
    // Fetch candidates
    const candidates = await User.find({ 
      role: 'candidat',
      $or: [
        { specialite: { $exists: true, $ne: '' } },
        { status: { $in: ['à la recherche', 'en attente', 'employé'] } } // Align with User model enum
      ]
    })
      .select('nom prenom email specialite experience status')
      .lean();

    // Fetch CVs for all candidates
    const candidateIds = candidates.map(c => c._id);
    const cvs = await CV.find({ candidat: { $in: candidateIds } })
      .select('nomFichier dateDepot candidat')
      .lean();

    // Map CVs to candidates
    const candidatesWithCVs = candidates.map(candidate => {
      const cv = cvs.find(cv => cv.candidat.toString() === candidate._id.toString());
      return {
        ...candidate,
        cv: cv ? { nomFichier: cv.nomFichier, dateUpload: cv.dateDepot } : null // Match frontend expectation
      };
    });

    // Filter candidates to include those with CVs or matching criteria
    const filteredCandidates = candidatesWithCVs.filter(candidate => 
      candidate.cv?.nomFichier || 
      candidate.specialite || 
      ['à la recherche', 'en attente', 'employé'].includes(candidate.status)
    );

    res.json(filteredCandidates);
  } catch (error) {
    console.error('Erreur lors de la récupération des candidats avec CV:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
module.exports = router;