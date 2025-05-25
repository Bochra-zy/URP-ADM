// backend/Routes/authRouteInterview.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // Critical import
const Interviews = require('../models/Interview'); // Use Interviews model
const User = require('../models/User');
const Offre = require('../models/Offres');
const Demande = require('../models/Demande');

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

// Middleware pour vérifier le rôle candidat
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

// Middleware pour vérifier le rôle responsable
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

// GET /api/interviews/interviewsADM - Fetch all interviews for admin
router.get('/interviewsADM', adminMiddleware, async (req, res) => {
  try {
    const interviews = await Interviews.find()
      .populate('candidat', 'nom prenom email')
      .populate('offre', 'titre typeContrat')
      .populate('responsable', 'nom prenom nom_entreprise')
      .lean();

    const formattedInterviews = interviews.map(interview => ({
      _id: interview._id,
      candidat: {
        nom: interview.candidat?.nom || 'Inconnu',
        prenom: interview.candidat?.prenom || '',
        email: interview.candidat?.email || 'Non disponible'
      },
      offre: {
        titre: interview.offre?.titre || 'Inconnue',
        typeContrat: interview.offre?.typeContrat || '-'
      },
      date: interview.date,
      dure: interview.dure,
      statut: interview.statut,
      decision: interview.decision || interview.statut, // Use decision field
      responsable: {
        nom: interview.responsable?.nom || 'Non spécifié',
        prenom: interview.responsable?.prenom || '',
        nom_entreprise: interview.responsable?.nom_entreprise || 'Non spécifié'
      },
      meetingLink: interview.meetingLink || null
    }));

    res.json(formattedInterviews);
  } catch (error) {
    console.error('Erreur lors de la récupération des entretiens:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/interviews/candidat - Fetch candidate's interviews
router.get('/candidat', candidatMiddleware, async (req, res) => {
  try {
    const interviews = await Interviews.find({ candidat: req.user.id })
      .populate('offre', 'titre typeContrat')
      .populate('candidat', 'nom prenom email')
      .populate('responsable', 'nom prenom nom_entreprise')
      .lean();

    const formattedInterviews = interviews.map(interview => ({
      _id: interview._id,
      candidat: {
        nom: interview.candidat?.nom || 'Inconnu',
        prenom: interview.candidat?.prenom || '',
        email: interview.candidat?.email || 'Non disponible'
      },
      offre: {
        titre: interview.offre?.titre || 'Inconnue',
        typeContrat: interview.offre?.typeContrat || '-'
      },
      date: interview.date,
      dure: interview.dure,
      statut: interview.statut,
      meetingLink: interview.meetingLink || null,
      responsable: {
        nom: interview.responsable?.nom || 'Non spécifié',
        prenom: interview.responsable?.prenom || '',
        nom_entreprise: interview.responsable?.nom_entreprise || 'Non spécifié'
      }
    }));

    res.json(formattedInterviews);
  } catch (error) {
    console.error('Erreur lors de la récupération des interviews:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/interviews - Fetch all interviews for the authenticated recruiter
router.get('/', responsableMiddleware, async (req, res) => {
  try {
    const interviews = await Interviews.find({ responsable: req.user.id })
      .populate('candidat', 'nom prenom')
      .populate('offre', 'titre')
      .lean();

    res.json(interviews);
  } catch (error) {
    console.error('Erreur lors de la récupération des interviews:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/interviews/statistiques/responsable - Fetch statistics for the authenticated recruiter
router.get('/statistiques/responsable', responsableMiddleware, async (req, res) => {
  try {
    const interviews = await Interviews.find({ responsable: req.user.id }).lean();
    const offres = await Offre.find({ responsable: req.user.id }).lean();
    const demandeOffreIds = offres.map(offre => offre._id);
    const demandes = await Demande.find({ offre: { $in: demandeOffreIds } }).lean();

    const totalInterviews = interviews.length;
    const acceptedInterviews = interviews.filter(i => i.decision === 'accepter').length;
    const rejectedInterviews = interviews.filter(i => i.decision === 'refuser').length;
    const pendingInterviews = interviews.filter(i => i.statut === 'planifié').length;
    const acceptedPercentage = totalInterviews > 0 
      ? Math.round((acceptedInterviews / totalInterviews) * 100) 
      : 0;
    
    const totalCandidatesApplied = demandes.length;
    const acceptedCandidates = demandes.filter(d => d.statut === 'acceptée').length;

    const stats = {
      totalInterviews,
      acceptedInterviews,
      rejectedInterviews,
      pendingInterviews,
      acceptedPercentage,
      offres,
      demandes,
      totalCandidatesApplied,
      acceptedCandidates,
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/interviews - Create a new interview
router.post('/', responsableMiddleware, async (req, res) => {
  try {
    const { candidatId, offreId, date, dure, meetingLink } = req.body;

    if (!candidatId || !offreId || !date) {
      return res.status(400).json({ message: 'Candidat, offre et date sont requis' });
    }

    const offre = await Offre.findOne({ _id: offreId, responsable: req.user.id });
    if (!offre) {
      return res.status(404).json({ message: 'Offre non trouvée ou non autorisée' });
    }

    const candidat = await User.findOne({ _id: candidatId, role: 'candidat' });
    if (!candidat) {
      return res.status(404).json({ message: 'Candidat non trouvé' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate) || parsedDate < new Date()) {
      return res.status(400).json({ message: 'Date invalide ou dans le passé' });
    }

    const interview = new Interviews({
      candidat: candidatId,
      offre: offreId,
      date: parsedDate,
      dure: Number(dure) || 30,
      meetingLink: meetingLink?.trim() || undefined,
      responsable: req.user.id,
      statut: 'planifié',
    });

    await interview.save();
    const populatedInterview = await Interviews.findById(interview._id)
      .populate('candidat', 'nom prenom email')
      .populate('offre', 'titre')
      .lean();

    res.status(201).json(populatedInterview);
  } catch (error) {
    console.error('Erreur lors de la planification de l\'interview:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Un entretien existe déjà pour ce candidat, cette offre et cette date' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/interviews/:id - Update an interview
router.put('/:id', responsableMiddleware, async (req, res) => {
  try {
    const { candidatId, offreId, date, dure, meetingLink, statut } = req.body;

    if (!candidatId || !offreId || !date) {
      return res.status(400).json({ message: 'Candidat, offre et date sont requis' });
    }

    const interview = await Interviews.findOne({ _id: req.params.id, responsable: req.user.id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview non trouvée ou non autorisée' });
    }

    const offre = await Offre.findOne({ _id: offreId, responsable: req.user.id });
    if (!offre) {
      return res.status(404).json({ message: 'Offre non trouvée ou non autorisée' });
    }

    const candidat = await User.findOne({ _id: candidatId, role: 'candidat' });
    if (!candidat) {
      return res.status(404).json({ message: 'Candidat non trouvé' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate) || parsedDate < new Date()) {
      return res.status(400).json({ message: 'Date invalide ou dans le passé' });
    }

    if (!['planifié', 'terminé', 'annulé'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    interview.candidat = candidatId;
    interview.offre = offreId;
    interview.date = parsedDate;
    interview.dure = Number(dure) || 30;
    interview.meetingLink = meetingLink?.trim() || undefined;
    interview.statut = statut;

    await interview.save();
    const populatedInterview = await Interviews.findById(interview._id)
      .populate('candidat', 'nom prenom email')
      .populate('offre', 'titre')
      .lean();

    res.json(populatedInterview);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'interview:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Un entretien existe déjà pour ce candidat, cette offre et cette date' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/interviews/:id/status - Update interview status
router.put('/:id/status', responsableMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['planifié', 'terminé', 'annulé'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const interview = await Interviews.findOne({ _id: req.params.id, responsable: req.user.id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview non trouvée ou non autorisée' });
    }

    interview.statut = status;
    await interview.save();
    const populatedInterview = await Interviews.findById(interview._id)
      .populate('candidat', 'nom prenom email')
      .populate('offre', 'titre')
      .lean();

    res.json(populatedInterview);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/interviews/:id/accept - Accept candidate as employee
// PUT /api/interviews/:id/accept - Accept candidate
router.put('/:id/accept', responsableMiddleware, async (req, res) => {
  try {
    const interview = await Interviews.findOne({ _id: req.params.id, offre: { $in: await Offre.find({ responsable: req.user.id }).distinct('_id') } });
    if (!interview) {
      return res.status(404).json({ message: 'Interview non trouvée ou non autorisée' });
    }

    if (interview.statut !== 'terminé') {
      return res.status(400).json({ message: 'L\'interview doit être terminée pour accepter le candidat' });
    }

    // Update interview decision
    interview.decision = 'accepter';
    await interview.save();

    // Update demande status
    const demande = await Demande.findOne({ 
      candidat: interview.candidat, 
      offre: interview.offre 
    });
    if (demande) {
      demande.statut = 'acceptée';
      await demande.save();
    }

    // Update candidate status to 'employé'
    const candidate = await User.findById(interview.candidat);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidat non trouvé' });
    }
    candidate.status = 'employé';
    await candidate.save();

    // Send congratulatory email
    const populatedInterview = await Interviews.findById(interview._id)
      .populate('candidat', 'nom prenom email')
      .populate('offre', 'titre')
      .lean();

    try {
      await sendEmail({
        to: populatedInterview.candidat.email,
        subject: 'Félicitations ! Votre candidature a été acceptée',
        text: `Bonjour ${populatedInterview.candidat.prenom} ${populatedInterview.candidat.nom},\n\nNous avons le plaisir de vous informer que votre candidature pour le poste "${populatedInterview.offre.titre}" a été acceptée suite à votre entretien. Félicitations !\n\nNous vous contacterons bientôt pour les prochaines étapes.\n\nCordialement,\nL'équipe de recrutement`,
        html: `
          <h2>Félicitations, ${populatedInterview.candidat.prenom} ${populatedInterview.candidat.nom} !</h2>
          <p>Nous avons le plaisir de vous informer que votre candidature pour le poste <strong>"${populatedInterview.offre.titre}"</strong> a été acceptée suite à votre entretien.</p>
          <p>Félicitations ! Nous vous contacterons bientôt pour les prochaines étapes.</p>
          <p>Cordialement,<br>L'équipe de recrutement</p>
        `,
      });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // Don't fail the request if email fails
    }

    res.json(populatedInterview);
  } catch (error) {
    console.error('Erreur lors de l\'acceptation du candidat:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/interviews/:id/reject - Reject candidate
// PUT /api/interviews/:id/reject - Reject candidate
router.put('/:id/reject', responsableMiddleware, async (req, res) => {
  try {
    const interview = await Interviews.findOne({ _id: req.params.id, offre: { $in: await Offre.find({ responsable: req.user.id }).distinct('_id') } });
    if (!interview) {
      return res.status(404).json({ message: 'Interview non trouvée ou non autorisée' });
    }

    if (interview.statut !== 'terminé') {
      return res.status(400).json({ message: 'L\'interview doit être terminée pour rejeter le candidat' });
    }

    // Update interview decision
    interview.decision = 'refuser';
    await interview.save();

    // Update demande status
    const demande = await Demande.findOne({ 
      candidat: interview.candidat, 
      offre: interview.offre 
    });
    if (demande) {
      demande.statut = 'rejetée';
      await demande.save();
    }

    // Ensure candidate status is 'à la recherche'
    const candidate = await User.findById(interview.candidat);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidat non trouvé' });
    }
    candidate.status = 'à la recherche';
    await candidate.save();

    // Send rejection email
    const populatedInterview = await Interviews.findById(interview._id)
      .populate('candidat', 'nom prenom email')
      .populate('offre', 'titre')
      .lean();

    try {
      await sendEmail({
        to: populatedInterview.candidat.email,
        subject: 'Mise à jour de votre candidature',
        text: `Bonjour ${populatedInterview.candidat.prenom} ${populatedInterview.candidat.nom},\n\nNous vous remercions pour votre candidature au poste "${populatedInterview.offre.titre}". Après examen, nous sommes désolés de vous informer que votre candidature n'a pas été retenue.\n\nNous vous souhaitons bonne chance dans vos recherches futures.\n\nCordialement,\nL'équipe de recrutement`,
        html: `
          <h2>Bonjour ${populatedInterview.candidat.prenom} ${populatedInterview.candidat.nom},</h2>
          <p>Nous vous remercions pour votre candidature au poste <strong>"${populatedInterview.offre.titre}"</strong>.</p>
          <p>Après examen, nous sommes désolés de vous informer que votre candidature n'a pas été retenue.</p>
          <p>Nous vous souhaitons bonne chance dans vos recherches futures.</p>
          <p>Cordialement,<br>L'équipe de recrutement</p>
        `,
      });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // Don't fail the request if email fails
    }

    res.json(populatedInterview);
  } catch (error) {
    console.error('Erreur lors du refus du candidat:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/interviews/check-rejection/:candidatId/:offreId - Check interview decision
router.get('/check-rejection/:candidatId/:offreId', responsableMiddleware, async (req, res) => {
  try {
    const { candidatId, offreId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(candidatId) || !mongoose.Types.ObjectId.isValid(offreId)) {
      return res.status(400).json({ message: 'ID de candidat ou d\'offre invalide' });
    }

    const offre = await Offre.findById(offreId);
    if (!offre || offre.responsable.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Offre non trouvée ou non autorisée' });
    }

    const interview = await Interviews.findOne({
      candidat: candidatId,
      offre: offreId,
    });

    if (!interview) {
      return res.status(200).json({ decision: 'none' });
    }

    const decision = interview.decision
      ? interview.decision === 'accepter'
        ? 'accepted'
        : 'rejected'
      : 'none';

    res.status(200).json({ decision });
  } catch (error) {
    console.error('Erreur lors de la vérification de la décision d\'interview:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;