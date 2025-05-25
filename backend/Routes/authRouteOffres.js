const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Offres = require('../models/Offres');

// Define JWT_SECRET (preferably from .env)
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
    return res.status(403).json({ message: 'Token invalide ou expiré', error: error.message });
  }
};

// GET /api/offres - Fetch all offers
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const offres = await Offres.find()
      .populate('responsable', 'nom_entreprise adresse_entreprise')
      .lean();

    // Transform response to match frontend expectations
    const formattedOffres = offres.map(offre => ({
      _id: offre._id,
      titre: offre.titre,
      description: offre.description,
      nom_entreprise: offre.responsable?.nom_entreprise || 'N/A',
      adresse_entreprise: offre.responsable?.adresse_entreprise || 'N/A',
      typeContrat: offre.typeContrat,
      statut: offre.statut,
      localisation: offre.localisation
    }));

    res.json(formattedOffres);
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


// DELETE /api/offres/:id - Delete an offer
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const offre = await Offres.findById(req.params.id);
    if (!offre) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }

    if (offre.statut === 'active') {
      return res.status(403).json({ message: 'Impossible de supprimer une offre active' });
    }

    await Offres.findByIdAndDelete(req.params.id);
    res.json({ message: 'Offre supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'offre:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


// Middleware to ensure the user is a candidate
const candidatMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Aucun token fourni' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'candidat') {
      return res.status(403).json({ message: 'Accès réservé aux candidats' });
    }
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return res.status(401).json({ message: 'Token invalide ou expiré', error: error.message });
  }
};

// GET /api/offres/candidat - Fetch all active offers for candidates
router.get('/candidat', candidatMiddleware, async (req, res) => {
  try {
    const offres = await Offres.find({ statut:'active' })
      .populate('responsable', 'nom_entreprise adresse_entreprise')
      .lean();

    if (!offres || offres.length === 0) {
      return res.json([]);
    }

    console.log('[GET /offres/candidat] Fetched offers:', offres.length);
    res.json(offres);
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
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


// GET /api/offres - Fetch all offers by the authenticated recruiter
router.get('/offRes', responsableMiddleware, async (req, res) => {
  try {
    const offres = await Offres.find({ responsable: req.user.id }).lean();
    res.json(offres);
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/offres/ajoutoffre - Create a new offer
router.post('/ajoutoffre', responsableMiddleware, async (req, res) => {
  try {
    const { titre, description, typeContrat, salaire, statut } = req.body;
    if (!titre?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Le titre et la description sont requis' });
    }
    if (!['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'].includes(typeContrat)) {
      return res.status(400).json({ message: 'Type de contrat invalide' });
    }
    if (!['active', 'inactif', 'clôturé'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const offre = new Offres({
      titre: titre.trim(),
      description: description.trim(),
      typeContrat,
      salaire: salaire ? Number(salaire) : undefined,
      statut,
      responsable: req.user.id,
      entreprise: {
        nom_entreprise: user.nom_entreprise || 'Entreprise inconnue',
        adresse_entreprise: user.adresse_entreprise || 'Adresse inconnue',
      },
    });

    await offre.save();
    res.status(201).json({ offre });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'offre:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/offres/:id - Update an offer
router.put('/:id', responsableMiddleware, async (req, res) => {
  try {
    const { titre, description, typeContrat, salaire } = req.body;
    if (!titre?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Le titre et la description sont requis' });
    }
    if (!['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'].includes(typeContrat)) {
      return res.status(400).json({ message: 'Type de contrat invalide' });
    }

    const offre = await Offres.findOne({ _id: req.params.id, responsable: req.user.id });
    if (!offre) {
      return res.status(404).json({ message: 'Offre non trouvée ou non autorisée' });
    }

    offre.titre = titre.trim();
    offre.description = description.trim();
    offre.typeContrat = typeContrat;
    offre.salaire = salaire ? Number(salaire) : undefined;

    await offre.save();
    res.json({ offre });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'offre:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PATCH /api/offres/:id/statut - Update offer status
router.patch('/:id/statut', responsableMiddleware, async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['active', 'inactif', 'clôturé'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const offre = await Offres.findOne({ _id: req.params.id, responsable: req.user.id });
    if (!offre) {
      return res.status(404).json({ message: 'Offre non trouvée ou non autorisée' });
    }

    offre.statut = statut;
    await offre.save();
    res.json({ offre });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE /api/offres/:id - Delete an offer
router.delete('/:id', responsableMiddleware, async (req, res) => {
  try {
    const offre = await Offres.findOneAndDelete({ _id: req.params.id, responsable: req.user.id });
    if (!offre) {
      return res.status(404).json({ message: 'Offre non trouvée ou non autorisée' });
    }
    res.json({ message: 'Offre supprimée' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'offre:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
module.exports = router;