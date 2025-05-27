const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
// Charger les variables d'environnement
dotenv.config();

// Initialiser l'application Express
const app = express();

// Middlewares
app.use(cors({
  origin: "http://portalite-frontend.s3-website-région.amazonaws.com"
})); // Permet les requêtes cross-origin (nécessaire pour votre frontend React)
app.use(express.json()); // Parse les requêtes JSON
app.use(express.urlencoded({ extended: true })); // Parse les requêtes URL-encoded

// Serve static files for CV downloads
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
})
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => console.error('Erreur de connexion à MongoDB:', err));

// Importer les routes
const adminRoutes = require('./Routes/authRoute');
const candidatRoutes = require('./Routes/authRouteCandidat');
const statRoutes = require('./Routes/authRouteStati');
const cvRoutes = require('./Routes/authRouteCV');
const offresRoutes = require('./Routes/authRouteOffres');
const interviewRoutes = require('./Routes/authRouteInterview'); 
const demandeRoutes = require('./Routes/authRouteDemande'); 
const responsableRoutes = require('./Routes/authRoutesResponsable');

// Monter les routes
app.use('/api/auth', adminRoutes);
app.use('/api/auth/candidat', candidatRoutes);
app.use('/api/stats',statRoutes );
app.use('/api/cv', cvRoutes);
app.use('/api/offres', offresRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/auth/responsable', responsableRoutes);

// Route de base pour tester le serveur
app.get('/', (req, res) => {
  res.send('Serveur en cours d\'exécution');
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});