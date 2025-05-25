const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs'); // Standard fs for createReadStream
const fsPromises = require('fs').promises; // fs.promises for async operations
const jwt = require('jsonwebtoken');
const CV = require('../models/Cv');
const CVAnalysis = require('../models/AnalyseCv');
const multer = require('multer');
const User = require('../models/User');
const pdfParse = require('pdf-parse');
const nlp = require('compromise');
const Tesseract = require('tesseract.js');

// Define JWT_SECRET
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../Uploads');
    console.log('Destination upload path:', uploadPath);
    if (!fs.existsSync(uploadPath)) {
      console.log('Creating upload directory:', uploadPath);
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `cv_${req.user.id}_${uniqueSuffix}${path.extname(file.originalname)}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/cv/upload - Upload or replace CV
router.post('/upload', candidatMiddleware, upload.single('cv'), async (req, res) => {
  try {
    console.log('Starting CV upload for user:', req.user.id);
    if (!req.file) {
      console.error('No file received in request');
      return res.status(400).json({ message: 'Aucun fichier sélectionné ou fichier invalide' });
    }

    console.log('File received:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    });

    const filePath = path.join(__dirname, '../Uploads', req.file.filename);
    console.log('Checking file at:', filePath);
    try {
      await fsPromises.access(filePath);
      console.log('File successfully saved to:', filePath);
    } catch (err) {
      console.error('File not found on disk after upload:', filePath, err);
      throw new Error('Échec de l\'enregistrement du fichier sur le serveur');
    }

    const existingCV = await CV.findOne({ candidat: req.user.id });
    if (existingCV) {
      if (existingCV.nomFichier) {
        const oldFilePath = path.join(__dirname, '../Uploads', existingCV.nomFichier);
        try {
          await fsPromises.access(oldFilePath);
          await fsPromises.unlink(oldFilePath);
          console.log('Deleted old file:', oldFilePath);
        } catch (err) {
          console.warn('Old file not found or could not be deleted:', oldFilePath, err);
        }
      }
      await CVAnalysis.deleteMany({ cv: existingCV._id });
      existingCV.nomFichier = req.file.filename;
      existingCV.dateDepot = new Date();
      await existingCV.save();
      console.log('Updated CV record:', existingCV);
    } else {
      const cv = new CV({
        candidat: req.user.id,
        nomFichier: req.file.filename,
        dateDepot: new Date(),
      });
      await cv.save();
      console.log('Created new CV record:', cv);
    }

    res.json({ message: existingCV ? 'CV remplacé avec succès' : 'CV déposé avec succès', nomFichier: req.file.filename });
  } catch (error) {
    console.error('Erreur lors de l\'upload du CV:', error);
    if (req.file) {
      const filePath = path.join(__dirname, '../Uploads', req.file.filename);
      try {
        await fsPromises.access(filePath);
        await fsPromises.unlink(filePath);
        console.log('Cleaned up failed upload file:', filePath);
      } catch (err) {
        console.warn('Could not clean up failed upload file:', filePath, err);
      }
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/cv/download/:nomFichier - Download CV
router.get('/download/:nomFichier', authMiddleware, async (req, res) => {
  try {
    const fileName = decodeURIComponent(req.params.nomFichier);
    console.log(`[GET /download] Requested filename: ${fileName}`);
    const filePath = path.join(__dirname, '../Uploads', fileName);

    try {
      await fsPromises.access(filePath);
      console.log(`[GET /download] File found at: ${filePath}`);
    } catch (err) {
      console.log(`[GET /download] File not found at: ${filePath}`);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    fs.createReadStream(filePath).pipe(res); // Use standard fs for streaming
  } catch (error) {
    console.error('[GET /download] Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/cv/existing - Check for existing CV
router.get('/existing', candidatMiddleware, async (req, res) => {
  try {
    const cv = await CV.findOne({ candidat: req.user.id }).lean();
    res.json({ cv: cv ? { nomFichier: cv.nomFichier, uploadedAt: cv.dateDepot } : null });
  } catch (error) {
    console.error('Erreur lors de la vérification du CV:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/cv/analyses - Fetch CV analyses
router.get('/analyses', candidatMiddleware, async (req, res) => {
  try {
    const cv = await CV.findOne({ candidat: req.user.id });
    if (!cv) {
      return res.json([]);
    }
    const analyses = await CVAnalysis.find({ cv: cv._id })
      .populate('responsable', 'nom prenom email nom_entreprise adresse_entreprise')
      .lean();
    res.json(analyses);
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE /api/cv/delete - Delete CV and analyses
router.delete('/delete', candidatMiddleware, async (req, res) => {
  try {
    const cv = await CV.findOne({ candidat: req.user.id });
    if (!cv) {
      return res.status(404).json({ message: 'Aucun CV trouvé' });
    }

    if (cv.nomFichier) {
      const filePath = path.join(__dirname, '../Uploads', cv.nomFichier);
      try {
        await fsPromises.access(filePath);
        await fsPromises.unlink(filePath);
        console.log('Deleted file:', filePath);
      } catch (err) {
        console.warn('File not found or could not be deleted:', filePath, err);
      }
    }

    await CVAnalysis.deleteMany({ cv: cv._id });
    await CV.deleteOne({ _id: cv._id });

    res.json({ message: 'CV supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du CV:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/cv/analyze - Analyze a CV file
router.post('/analyze', responsableMiddleware, async (req, res) => {
  console.log('Requête reçue pour /api/cv/analyze avec nomFichier:', req.body.nomFichier);
  try {
    const { nomFichier } = req.body;
    if (!nomFichier) {
      console.log('Erreur: Nom du fichier manquant');
      return res.status(400).json({ message: 'Nom du fichier requis' });
    }

    const cv = await CV.findOne({ nomFichier });
    if (!cv) {
      console.log(`Erreur: CV non trouvé dans la base de données pour nomFichier: ${nomFichier}`);
      return res.status(404).json({ message: 'CV non trouvé dans la base de données' });
    }
    console.log('CV trouvé dans la base de données:', cv);

    const filePath = path.join(__dirname, '../Uploads', nomFichier);
    console.log('Chemin du fichier:', filePath);

    try {
      await fsPromises.access(filePath);
      console.log('Fichier trouvé sur le serveur:', filePath);
    } catch (err) {
      console.error(`Erreur: Fichier non trouvé sur le serveur à: ${filePath}`, err);
      return res.status(404).json({ message: 'Fichier CV non trouvé sur le serveur' });
    }

    const dataBuffer = await fsPromises.readFile(filePath);
    let rawText;
    try {
      const pdfData = await pdfParse(dataBuffer, {
        max: 0,
        normalizeWhitespace: true,
      });
      rawText = pdfData.text;
      console.log('Text extracted with pdf-parse:', rawText.substring(0, 1000));
    } catch (error) {
      console.warn('pdf-parse failed, attempting OCR with Tesseract:', error.message);
      const { createWorker } = Tesseract;
      const worker = await createWorker();
      await worker.load();
      await worker.loadLanguage('eng+fra+ara');
      await worker.initialize('eng+fra+ara');
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789éèàçùêôîâû-., ',
      });
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();
      rawText = text;
      console.log('Text extracted with Tesseract:', rawText.substring(0, 1000));
    }

    if (!rawText || rawText.trim().length === 0) {
      console.log('Erreur: Aucun texte extrait du CV');
      return res.status(400).json({ message: 'Aucun texte extrait du CV' });
    }
    console.log('Longueur du texte extrait:', rawText.length);
    const lines = rawText.split('\n').filter(line => line.trim().length > 0);
    console.log('Nombre de lignes extraites:', lines.length);

    const analysisResult = {
      domain: 'Non spécifié',
      hardSkills: [],
      softSkills: [],
      languages: [],
      experience: [],
      education: { level: 'Non spécifié', field: 'Non spécifié', institution: 'Non spécifié' },
      location: 'Non spécifiée',
    };

    const doc = nlp(rawText);
    const people = doc.people().out('array');
    const organizations = doc.organizations().out('array');
    const places = doc.places().out('array');

    const domains = {
      Management: ['management', 'gestion', 'administration', 'business', 'commerce'],
      Finance: ['finance', 'comptabilité', 'banque', 'comptable', 'analyste financier', 'audit', 'gestion financière', 'budget'],
      Hôtellerie: ['hôtel', 'hospitality', 'reception', 'accueil', 'tourisme'],
      Informatique: ['développeur', 'informatique', 'software', 'programmeur', 'it', 'data', 'cloud', 'devops'],
      Médecine: ['médecin', 'infirmier', 'santé', 'médical', 'pharmacien', 'chirurgien'],
      Droit: ['avocat', 'juriste', 'droit', 'légal', 'notaire'],
      Marketing: ['marketing', 'publicité', 'communication', 'digital', 'seo', 'marque'],
      Ingénierie: ['ingénieur', 'mécanique', 'civil', 'électrique', 'aéronautique'],
    };

    const textLower = rawText.toLowerCase();
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => textLower.includes(keyword.toLowerCase()))) {
        analysisResult.domain = domain;
        break;
      }
    }

    const hardSkills = {
      Management: ['microsoft word', 'powerpoint', 'excel', 'billing', 'invoice', 'bank statement', 'sage', 'accounting', 'stock management', 'quality control'],
      Finance: ['excel', 'sap', 'quickbooks', 'analyse financière', 'gestion de portefeuille', 'comptabilité générale'],
      Hôtellerie: ['reception', 'customer service', 'reservation management'],
      Informatique: ['javascript', 'python', 'java', 'sql', 'react', 'node.js', 'aws', 'docker', 'git', 'linux'],
      Médecine: ['soins intensifs', 'chirurgie', 'diagnostic', 'pharmacologie'],
      Droit: ['rédaction juridique', 'négociation de contrats', 'recherche légale'],
      Marketing: ['seo', 'google analytics', 'publicité digitale', 'gestion de marque'],
      Ingénierie: ['autocad', 'matlab', 'solidworks', 'gestion de projet'],
    };

    const softSkills = [
      'creativity', 'teamwork', 'rigorous', 'dynamic', 'communication', 'travail d\'équipe', 'résolution de problèmes',
      'gestion du temps', 'leadership', 'adaptabilité', 'gestion de projet', 'empathie', 'collaboration', 'organisation',
      'initiative', 'gestion du stress', 'ambitious', 'motivated',
    ];

    let allHardSkills = [];
    Object.values(hardSkills).forEach(skills => allHardSkills.push(...skills));
    analysisResult.hardSkills = allHardSkills.filter(skill => textLower.includes(skill.toLowerCase()));
    analysisResult.softSkills = softSkills.filter(skill => textLower.includes(skill.toLowerCase()));

    const languages = [
      { keyword: 'français', language: 'Français', proficiency: 'Non spécifié' },
      { keyword: 'anglais', language: 'Anglais', proficiency: 'Non spécifié' },
      { keyword: 'espagnol', language: 'Espagnol', proficiency: 'Non spécifié' },
      { keyword: 'allemand', language: 'Allemand', proficiency: 'Non spécifié' },
      { keyword: 'arabe', language: 'Arabe', proficiency: 'Non spécifié' },
      { keyword: 'english', language: 'Anglais', proficiency: 'Non spécifié' },
      { keyword: 'spanish', language: 'Espagnol', proficiency: 'Non spécifié' },
      { keyword: 'arabic', language: 'Arabe', proficiency: 'Non spécifié' },
    ];

    const proficiencyPatterns = {
      courant: ['courant', 'natif', 'fluide', 'bilingue', 'fluent', 'native'],
      avancé: ['avancé', 'professionnel', 'c1', 'c2'],
      intermédiaire: ['intermédiaire', 'conversationnel', 'b1', 'b2'],
      débutant: ['débutant', 'base', 'a1', 'a2'],
    };

    analysisResult.languages = languages
      .filter(lang => textLower.includes(lang.keyword.toLowerCase()))
      .map(lang => {
        let proficiency = 'Non spécifié';
        for (const [level, keywords] of Object.entries(proficiencyPatterns)) {
          if (keywords.some(keyword => textLower.includes(keyword.toLowerCase()))) {
            proficiency = level.charAt(0).toUpperCase() + level.slice(1);
            break;
          }
        }
        return { language: lang.language, proficiency };
      });

    const experienceRegex = /(?:function|fonction|internship|stage)\s*:\s*([A-Za-z\s\-\']+)\s*(?:chez\s*|\@|at\s*)?([\w\s\-\']+?)(?:\s*(?:\((\d+)\s*(?:an|ans|année|années|year|years)\)|(\w+\s*\d{4}\s*-\s*(?:\w+\s*\d{4}|present|currently|novembre|september))|\(?(currently|present)\)?))?/gi;
    const experienceSection = lines
      .filter(line => line.match(/expérience|experience|emploi|work history|professional experience|internship|stage/i))
      .join('\n') || rawText;

    const excludeTerms = [
      'contact', 'email', 'telephone', 'location', 'skills', 'languages', 'computer skills',
      'education', 'training', 'graduated', 'ambitious', 'dynamic', 'motivated', 'khaoula',
      'fekih', 'gmail', 'spirit', 'native', 'fluent', 'very good', 'microsoft', 'word',
      'power point', 'excel', 'currently', 'billing method', 'pointing', 'payment', 'verification',
      'suppliers', 'sales tracking', 'recipe', 'license', 'diploma', 'baccalaureat', 'tunisia',
      'sousse', 'kaser hlel', 'khniss', 'atec', 'sage', 'taxation', 'business administration',
    ];

    let match;
    while ((match = experienceRegex.exec(textLower)) !== null) {
      let jobTitle = match[1]?.trim();
      const company = match[2]?.trim() || 'Non spécifié';
      const duration = match[3] ? `${match[3]} an${match[3] > 1 ? 's' : ''}` : (match[4] || match[5] || 'Non spécifié');

      if (jobTitle && jobTitle.length > 2 && !excludeTerms.some(term => jobTitle.toLowerCase().includes(term))) {
        jobTitle = jobTitle.replace(/\b\w/g, c => c.toUpperCase());
        analysisResult.experience.push({ jobTitle, duration, company });
      }
    }

    const educationSection = lines
      .filter(line => line.match(/éducation|formation|education|academic|degree/i))
      .join('\n') || rawText;

    const educationLevels = {
      Doctorat: ['doctorat', 'phd', 'docteur'],
      Master: ['master', 'maîtrise', 'msc', 'mba'],
      Licence: ['licence', 'bachelor', 'ba', 'bsc', 'degree'],
      DUT: ['dut', 'bts', 'deug'],
      Bac: ['baccalauréat', 'bac'],
    };

    for (const [level, keywords] of Object.entries(educationLevels)) {
      if (keywords.some(keyword => textLower.includes(keyword.toLowerCase()))) {
        analysisResult.education.level = level;
        break;
      }
    }

    const educationRegex = /(?:doctorat|master|licence|dut|bac|bachelor|msc|mba|bts|phd|degree)\s*(?:in\s*|en\s*)?([\w\s]+?)(?:\s*(?:à|at|from)\s*([\w\s]+))?(?:,|\.|\n|$)/i;
    const educationMatch = educationSection.match(educationRegex);
    if (educationMatch) {
      analysisResult.education.field = educationMatch[1]?.trim() || 'Non spécifié';
      analysisResult.education.institution = educationMatch[2]?.trim() || 'Non spécifié';
    }

    analysisResult.location = places.find(place => textLower.includes(place.toLowerCase())) || 'Non spécifiée';

    // Enregistrer l'analyse dans la base de données
    const analysis = new CVAnalysis({
      cv: cv._id, // Utiliser l'instance 'cv' correcte
      responsable: req.user.id,
      dateAnalyse: new Date(),
    });
    await analysis.save();
    console.log('Analyse enregistrée dans la base de données:', analysis);

    // Envoyer la réponse avec les résultats de l'analyse
    console.log('Résultat de l\'analyse:', JSON.stringify(analysisResult, null, 2));
    return res.json(analysisResult);
  } catch (error) {
    console.error('Erreur lors de l\'analyse du CV:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'analyse du CV', details: error.message });
  }
});

module.exports = router;