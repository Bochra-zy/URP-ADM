const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Demande = require('../models/Demande');
const nodemailer = require('nodemailer');
const Offre = require('../models/Offres');
const CV = require('../models/Cv');

// Define JWT_SECRET (preferably from .env)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète';

// Middleware to verify JWT and candidate role
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
// GET /api/demandes/demandes/candidat - Fetch candidate's demands
router.get('/demandes/candidat', candidatMiddleware, async (req, res) => {
  try {
    const demandes = await Demande.find({ candidat: req.user.id })
      .populate('offre', 'titre typeContrat')
      .lean();

    // Map statut to match frontend expectations
    const formattedDemandes = demandes.map(demande => ({
      _id: demande._id,
      offre: {
        titre: demande.offre?.titre || 'Offre inconnue',
        typeContrat: demande.offre?.typeContrat || '-'
      },
      statut: demande.statut === 'accepter' ? 'acceptée' : demande.statut === 'refuser' ? 'rejetée' : 'en attente',
      createdAt: demande.createdAt,
      dateDemande: demande.dateDemande
    }));

    res.json(formattedDemandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/demandes/candidat - Fetch all demands for the logged-in candidate
router.get('/candidat', candidatMiddleware, async (req, res) => {
  try {
    const demandes = await Demande.find({ candidat: req.user.id })
      .populate({
        path: 'offre',
        select: 'titre typeContrat ',
        populate: {
          path: 'responsable',
          select: 'nom_entreprise adresse_entreprise tel',
        },
      })
      
      .lean();
    if (!demandes || demandes.length === 0) {
      return res.json([]); // Return empty array if no demands found
    }

    // Ensure entreprise data is included in the response
    const formattedDemandes = demandes.map((demande) => ({
      ...demande,
      offre: {
        ...demande.offre,
        entreprise: demande.offre.responsable || demande.offre.entreprise || {},
      },
    }));

    console.log('[GET /demandes/candidat] Fetched demands:', formattedDemandes); // For debugging
    res.json(formattedDemandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE /api/demandes/:demandeId - Delete a specific demand
router.delete('/:demandeId', candidatMiddleware, async (req, res) => {
  try {
    const demandeId = req.params.demandeId;
    const demande = await Demande.findById(demandeId);

    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    // Check if the demand belongs to the logged-in candidate
    if (demande.candidat.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette demande' });
    }

    // Only allow deletion if the status is 'en attente'
    if (demande.statut !== 'en attente') {
      return res.status(400).json({ message: 'Seules les demandes en attente peuvent être supprimées' });
    }

    await Demande.deleteOne({ _id: demandeId });
    console.log(`[DELETE /demandes/${demandeId}] Demande supprimée pour l'utilisateur ${req.user.id}`);
    res.json({ message: 'Demande supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la demande:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service (e.g., 'sendgrid', 'outlook')
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or App Password
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Erreur de configuration Nodemailer:', error);
  } else {
    console.log('Nodemailer prêt pour envoyer des emails');
  }
});



// POST /api/demandes - Create a new demand and send email to the offer's responsable
// POST /api/demandes - Create a new demand and send email to the offer's responsable
router.post('/', candidatMiddleware, async (req, res) => {
  try {
    const { offreId } = req.body;

    if (!offreId || !mongoose.Types.ObjectId.isValid(offreId)) {
      return res.status(400).json({ message: 'ID de l\'offre invalide' });
    }

    // Fetch offer with responsible details
    const offre = await Offre.findById(offreId).populate('responsable', 'nom prenom email nom_entreprise adresse_entreprise tel');
    if (!offre) {
      return res.status(404).json({ message: 'Offre non trouvée ou inactive' });
    }

    // Check if the candidate has already applied
    const existingDemande = await Demande.findOne({
      candidat: req.user.id,
      offre: offreId,
    });
    if (existingDemande) {
      return res.status(400).json({ message: 'Vous avez déjà postulé à cette offre' });
    }

    // Fetch candidate details
    const candidate = await User.findById(req.user.id, 'nom prenom email');
    if (!candidate) {
      return res.status(404).json({ message: 'Candidat non trouvé' });
    }

    // Create new demand
    const demande = new Demande({
      candidat: req.user.id,
      offre: offreId,
      responsable: offre.responsable ? offre.responsable._id : null,
      statut: 'en attente',
      dateDemande: new Date(),
    });
    await demande.save();

    // Send email to the responsable (if email exists)
    if (offre.responsable && offre.responsable.email) {
      const mailOptions = {
        from: `"Plateforme de Recrutement" <${process.env.EMAIL_USER}>`,
        to: offre.responsable.email,
        subject: `Nouvelle candidature pour l'offre: ${offre.titre}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
            <h3 style="color: #333;">Nouvelle candidature reçue</h3>
            <p><strong>Offre:</strong> ${offre.titre}</p>
            <p><strong>Candidat:</strong> ${candidate.nom} ${candidate.prenom}</p>
            <p><strong>Email du candidat:</strong> ${candidate.email}</p>
            <p><strong>Entreprise:</strong> ${offre.responsable.nom_entreprise || 'Non spécifiée'}</p>
            <p><strong>Date de candidature:</strong> ${new Date(demande.dateDemande).toLocaleString('fr-FR')}</p>
            <p style="margin-top: 20px;">Veuillez consulter la plateforme pour examiner la candidature.</p>
            <p style="color: #777;">Cordialement,<br>L'équipe de la plateforme</p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[POST /demandes] Email envoyé à ${offre.responsable.email} pour la demande ${demande._id}`);
      } catch (emailError) {
        console.error(`[POST /demandes] Erreur lors de l'envoi de l'email à ${offre.responsable.email}:`, emailError);
      }
    } else {
      // Notify admin if no responsible email
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@platform.com';
      const adminMailOptions = {
        from: `"Plateforme de Recrutement" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `Erreur: Candidature sans email responsable pour ${offre.titre}`,
        html: `
          <h3>Erreur de notification</h3>
          <p>Une candidature a été soumise pour l'offre <strong>${offre.titre}</strong>, mais aucun email de responsable n'est disponible.</p>
          <p><strong>Candidat:</strong> ${candidate.nom} ${candidate.prenom}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p>Veuillez vérifier l'offre ${offreId} dans la plateforme.</p>
        `,
      };
      try {
        await transporter.sendMail(adminMailOptions);
        console.log(`[POST /demandes] Email d'erreur envoyé à ${adminEmail}`);
      } catch (adminEmailError) {
        console.error(`[POST /demandes] Erreur lors de l'envoi de l'email admin:`, adminEmailError);
      }
    }

    console.log(`[POST /demandes] Demande créée pour l'utilisateur ${req.user.id}, offre ${offreId}`);
    res.status(201).json({ message: 'Candidature soumise avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Vous avez déjà postulé à cette offre' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
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
// GET /api/demandes/offre/:offreId - Fetch demands for a specific offer
router.get('/offre/:offreId', responsableMiddleware, async (req, res) => {
  try {
    const offre = await Offre.findOne({ _id: req.params.offreId, responsable: req.user.id });
    if (!offre) {
      return res.status(404).json({ message: 'Offre non trouvée ou non autorisée' });
    }

    const demandes = await Demande.find({ offre: req.params.offreId })
      .populate('candidat', 'nom prenom email')
      .lean();

    // Fetch CV for each demande's candidate
    const demandesWithCV = await Promise.all(
      demandes.map(async (demande) => {
        const cv = await CV.findOne({ candidat: demande.candidat._id }).lean();
        return {
          ...demande,
          cvNomFichier: cv ? cv.nomFichier : null, // Add cvNomFichier to response
        };
      })
    );

    demandesWithCV.forEach((demande) => {
      console.log(`Demande ${demande._id}:`, {
        statut: demande.statut,
        cvNomFichier: demande.cvNomFichier || 'missing',
        candidat: demande.candidat,
      });
    });

    res.json(demandesWithCV);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PATCH /api/demandes/:id/statut - Update demand status
router.patch('/:id/statut', responsableMiddleware, async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['en attente', 'acceptée', 'rejetée'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const demande = await Demande.findById(req.params.id).populate('offre');
    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }
    if (demande.offre.responsable.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    demande.statut = statut;
    await demande.save();
    res.json({ demande });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


// GET /api/demandes/responsable - Fetch accepted demands for the responsable
router.get('/responsable', responsableMiddleware, async (req, res) => {
  try {
    console.log(`Fetching demands for responsable ID: ${req.user.id}`);
    const demandes = await Demande.find({ 
      // Remove responsable filter if not set in Demande
      // responsable: req.user.id,
      statut: 'acceptée'
    })
      .populate('candidat', 'nom prenom email specialite experience status')
      .populate('offre', 'titre description typeContrat salaire responsable')
      .lean();

    console.log(`Found ${demandes.length} accepted demands`);

    const formattedDemandes = await Promise.all(
      demandes.filter(demande => demande.offre && demande.offre.responsable && demande.offre.responsable.toString() === req.user.id)
        .map(async (demande) => {
          const cv = await CV.findOne({ candidat: demande.candidat._id }).lean();
          console.log(`Demande ${demande._id}:`, {
            candidat: demande.candidat._id,
            offre: demande.offre._id,
            cv: cv ? cv.nomFichier : 'none'
          });
          return {
            _id: demande.candidat._id,
            nom: demande.candidat.nom,
            prenom: demande.candidat.prenom,
            email: demande.candidat.email,
            specialite: demande.candidat.specialite,
            experience: demande.candidat.experience,
            status: demande.candidat.status,
            demandeStatut: demande.statut,
            cv: cv ? { nomFichier: cv.nomFichier, dateDepot: cv.dateDepot } : null,
            offre: demande.offre ? {
              _id: demande.offre._id,
              titre: demande.offre.titre,
              description: demande.offre.description,
              typeContrat: demande.offre.typeContrat,
              salaire: demande.offre.salaire,
            } : null,
            entreprise: {
              nom_entreprise: req.user.nom_entreprise || 'Non spécifié',
              adresse_entreprise: req.user.adresse_entreprise || 'Non spécifié',
              tel: req.user.tel || 'Non spécifié',
            },
          };
        })
    );

    console.log(`Returning ${formattedDemandes.length} formatted candidates`);
    res.json(formattedDemandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
module.exports = router;