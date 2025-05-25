const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CV = require('../models/Cv');
const Demande = require('../models/Demande');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'zayanebochra@gmail.com',
    pass: 'vikfgtcvfrcbogny',
  },
});

// Define JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète';

// Middleware pour vérifier le token JWT et le rôle admin
const adminMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Aucun token fourni' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

// POST /api/auth/admin/login - Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const foundUser = await User.findOne({ email, role: 'admin' });
    if (!foundUser) return res.status(400).json({ message: 'Email invalide' });

    const isMatch = await foundUser.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe invalide' });

    const token = jwt.sign({ id: foundUser._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/auth/admin/profile - Fetch admin profile
router.get('/profile', adminMiddleware, async (req, res) => {
  try {
    const foundAdmin = await User.findById(req.user.id).select('-password').lean();
    if (!foundAdmin) return res.status(404).json({ message: 'Admin non trouvé' });

    res.json(foundAdmin);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/auth/admin/profile - Update admin profile
router.put('/profile', adminMiddleware, async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;
    const foundAdmin = await User.findById(req.user.id);
    if (!foundAdmin) return res.status(404).json({ message: 'Admin non trouvé' });

    if (nom) foundAdmin.nom = nom;
    if (prenom) foundAdmin.prenom = prenom;
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Email invalide' });
      }
      if (email !== foundAdmin.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        foundAdmin.email = email;
      }
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      const salt = await bcrypt.genSalt(10);
      foundAdmin.password = await bcrypt.hash(password, salt);
    }

    const updatedAdmin = await foundAdmin.save();
    res.json({
      _id: updatedAdmin._id,
      nom: updatedAdmin.nom,
      prenom: updatedAdmin.prenom,
      email: updatedAdmin.email,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/auth/admin/forgot-password - Forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const foundAdmin = await User.findOne({ email, role: 'admin' });
    if (!foundAdmin) return res.status(404).json({ message: 'Email non trouvé' });

    const resetToken = jwt.sign({ id: foundAdmin._id }, JWT_SECRET, { expiresIn: '15m' });
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    const mailOptions = {
      from: 'zayanebochra@gmail.com',
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      text: `Vous avez demandé une réinitialisation de mot de passe. Cliquez sur ce lien pour réinitialiser : ${resetUrl}. Ce lien expire dans 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Un email de réinitialisation a été envoyé à votre adresse.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email', error: error.message });
  }
});

// POST /api/auth/admin/reset-password - Reset password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const foundAdmin = await User.findById(decoded.id);
    if (!foundAdmin || foundAdmin.role !== 'admin') {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Use updateOne to avoid triggering pre('save') hook
    await User.updateOne(
      { _id: foundAdmin._id, role: 'admin' },
      { $set: { password: hashedPassword } }
    );

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ message: 'Token invalide ou expiré', error: error.message });
  }
});

// GET /api/auth/admin/candidats - Fetch all candidates
router.get('/candidats', adminMiddleware, async (req, res) => {
  try {
    const candidats = await User.find({ role: 'candidat' }).select(
      'nom prenom email specialite experience tel status hasDemandes'
    ).lean();
    res.json(candidats.map(candidat => ({
      ...candidat,
      hasDemandes: candidat.hasDemandes ?? false,
    })));
  } catch (error) {
    console.error('Erreur lors du chargement des candidats:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/auth/admin/candidats/:id - Fetch candidate details
router.get('/candidats/:id', adminMiddleware, async (req, res) => {
  try {
    const candidat = await User.findById(req.params.id)
      .select('nom prenom email specialite tel experience status')
      .lean();

    if (!candidat) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Fetch CV
    const cv = await CV.findOne({ candidat: req.params.id }).lean();
    candidat.cv = cv ? { nomFichier: cv.nomFichier, chemin: cv.chemin } : null;

    // Fetch demands
    const demandes = await Demande.find({ candidat: req.params.id })
      .populate({
        path: 'offre',
        select: 'titre typeContrat description salaire localisation',
        populate: {
          path: 'responsable',
          select: 'nom_entreprise adresse_entreprise tel',
        },
      })
      .select('status createdAt')
      .lean();

    candidat.demandes = demandes.map(demande => ({
      statut: demande.status,
      dateDemande: demande.createdAt,
      offre: demande.offre
        ? {
            titre: demande.offre.titre,
            typeContrat: demande.offre.typeContrat,
            description: demande.offre.description,
            salaire: demande.offre.salaire,
            localisation: demande.offre.localisation,
            entreprise: demande.offre.responsable
              ? {
                  nom_entreprise: demande.offre.responsable.nom_entreprise,
                  adresse_entreprise: demande.offre.responsable.adresse_entreprise,
                  tel: demande.offre.responsable.tel,
                }
              : null,
          }
        : null,
    }));

    res.json(candidat);
  } catch (error) {
    console.error('Erreur lors du chargement des détails du candidat:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/auth/admin/candidats/:id - Update candidate details
router.put('/candidats/:id', adminMiddleware, async (req, res) => {
  try {
    const { nom, prenom, email, password, specialite, experience, status } = req.body;

    // Validate required fields
    if (!nom || !prenom || !email || !specialite) {
      return res.status(400).json({ message: 'Nom, prénom, email et spécialité sont obligatoires' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email invalide' });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    if (status && !['à la recherche', 'employé', 'en attente'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const candidat = await User.findById(req.params.id);
    if (!candidat) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Check for duplicate email
    if (email !== candidat.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    // Update fields
    candidat.nom = nom;
    candidat.prenom = prenom;
    candidat.email = email;
    candidat.specialite = specialite;
    candidat.experience = experience || null;
    candidat.status = status || candidat.status;
    candidat.role = 'candidat'; // Ensure role is set to 'candidat'
    if (password) {
      const salt = await bcrypt.genSalt(10);
      candidat.password = await bcrypt.hash(password, salt);
    }

    await candidat.save();
    res.json({
      _id: candidat._id,
      nom: candidat.nom,
      prenom: candidat.prenom,
      email: candidat.email,
      specialite: candidat.specialite,
      experience: candidat.experience,
      status: candidat.status,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du candidat:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE /api/auth/admin/candidats/:id - Delete a candidate
router.delete('/candidats/:id', adminMiddleware, async (req, res) => {
  try {
    const candidat = await User.findById(req.params.id);
    if (!candidat) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Check if candidate has demands or is employed
    const hasDemandes = await Demande.exists({ candidat: req.params.id });
    if (hasDemandes) {
      return res.status(400).json({ message: 'Suppression impossible : le candidat a des demandes' });
    }
    if (candidat.status === 'employé') {
      return res.status(400).json({ message: 'Suppression impossible : le candidat est employé' });
    }

    // Delete associated CV
    await CV.deleteOne({ candidat: req.params.id });
    // Delete the candidate
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidat supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du candidat:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/auth/admin/new-candidats - Add a new candidate
router.post('/new-candidats', adminMiddleware, async (req, res) => {
  try {
    const { nom, prenom, email, password, specialite, experience } = req.body;

    if (!nom || !prenom || !email || !password || !specialite) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email invalide' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const existingCandidat = await User.findOne({ email });
    if (existingCandidat) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCandidat = new User({
      nom,
      prenom,
      email,
      password: hashedPassword,
      specialite,
      experience: experience || null,
      role: 'candidat',
      status: 'à la recherche',
      hasDemandes: false,
    });

    await newCandidat.save();
    res.status(201).json({ message: 'Candidat ajouté avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du candidat:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


// GET /api/auth/admin/responsables - Fetch all responsables
router.get('/responsables', adminMiddleware, async (req, res) => {
  try {
    const responsables = await User.find({ role: 'responsable' }).select(
      'nom prenom email nom_entreprise specialite adresse_entreprise tel role'
    ).lean();
    res.json(responsables);
  } catch (error) {
    console.error('Erreur lors du chargement des responsables:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/auth/admin/responsables/:id - Fetch responsable details
router.get('/responsables/:id', adminMiddleware, async (req, res) => {
  try {
    const responsable = await User.findById(req.params.id)
      .select('nom prenom email nom_entreprise specialite adresse_entreprise tel role')
      .lean();
    if (!responsable) {
      return res.status(404).json({ message: 'Responsable non trouvé' });
    }
    res.json(responsable);
  } catch (error) {
    console.error('Erreur lors du chargement des détails du responsable:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/auth/admin/responsables - Add a new responsable
router.post('/new-responsable', adminMiddleware, async (req, res) => {
  try {
    const { nom, prenom, email, password, nom_entreprise, specialite, adresse_entreprise, tel } = req.body;

    if (!nom || !prenom || !email || !password || !nom_entreprise || !specialite || !adresse_entreprise) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email invalide' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newResponsable = new User({
      nom,
      prenom,
      email,
      password: hashedPassword,
      nom_entreprise,
      specialite,
      adresse_entreprise,
      tel: tel || null,
      role: 'responsable',
    });

    await newResponsable.save();
    res.status(201).json({ message: 'Responsable ajouté avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du responsable:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/auth/admin/responsables/:id - Update responsable details
router.put('/responsables/:id', adminMiddleware, async (req, res) => {
  try {
    const { nom, prenom, email, password, nom_entreprise, specialite, adresse_entreprise, tel } = req.body;

    if (!nom || !prenom || !email || !nom_entreprise || !specialite || !adresse_entreprise) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email invalide' });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const responsable = await User.findById(req.params.id);
    if (!responsable) {
      return res.status(404).json({ message: 'Responsable non trouvé' });
    }

    if (email !== responsable.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    responsable.nom = nom;
    responsable.prenom = prenom;
    responsable.email = email;
    responsable.nom_entreprise = nom_entreprise;
    responsable.specialite = specialite;
    responsable.adresse_entreprise = adresse_entreprise;
    responsable.tel = tel || null;
    responsable.role = 'responsable';
    if (password) {
      const salt = await bcrypt.genSalt(10);
      responsable.password = await bcrypt.hash(password, salt);
    }

    await responsable.save();
    res.json({
      _id: responsable._id,
      nom: responsable.nom,
      prenom: responsable.prenom,
      email: responsable.email,
      nom_entreprise: responsable.nom_entreprise,
      specialite: responsable.specialite,
      adresse_entreprise: responsable.adresse_entreprise,
      tel: responsable.tel,
      role: responsable.role,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du responsable:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE /api/auth/admin/responsables/:id - Delete a responsable
router.delete('/responsables/:id', adminMiddleware, async (req, res) => {
  try {
    const responsable = await User.findById(req.params.id);
    if (!responsable) {
      return res.status(404).json({ message: 'Responsable non trouvé' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Responsable supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du responsable:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
module.exports = router;