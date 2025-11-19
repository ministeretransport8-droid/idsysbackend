require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('./database/database');
const authRoutes = require('./routes/auth');
const agentsRoutes = require('./routes/agents');
const exportRoutes = require('./routes/export');
const bureauxRoutes = require('./routes/bureaux');
const cellulesRoutes = require('./routes/cellules');
const utilisateursRoutes = require('./routes/utilisateurs');
const gradesRoutes = require('./routes/grades');
const fonctionsRoutes = require('./routes/fonctions');
const categoriesProfessionnellesRoutes = require('./routes/categories-professionnelles');

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware CORS - Accepter les requêtes de partout
app.use(cors({
  origin: '*', // Accepter toutes les origines
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false // Pas de credentials pour origin: '*'
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Créer les dossiers nécessaires
const dirs = [
  './exports',
  './exports/cartes',
  './exports/csv',
  './exports/backup',
  './uploads',
  './uploads/photos',
  './uploads/documents'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Servir les fichiers statiques depuis le dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/bureaux', bureauxRoutes);
app.use('/api/cellules', cellulesRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/fonctions', fonctionsRoutes);
app.use('/api/categories-professionnelles', categoriesProfessionnellesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'IdTrack API is running' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✓ Serveur backend démarré sur le port ${PORT}`);
  console.log(`✓ API disponible sur http://localhost:${PORT}/api`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health\n`);
});

// Initialiser la base de données (après le démarrage du serveur pour ne pas bloquer)
Database.init()
  .then(() => {
    console.log('✓ Base de données initialisée avec succès.');
  })
  .catch(err => {
    console.error('⚠️  Erreur initialisation base de données:', err.message);
    console.error('⚠️  Le serveur continue de fonctionner, mais certaines fonctionnalités peuvent être limitées.');
    console.error('⚠️  Vérifiez la connexion MySQL et exécutez les migrations si nécessaire: npm run migrate\n');
  });

