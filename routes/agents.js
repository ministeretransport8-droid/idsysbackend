const express = require('express');
const router = express.Router();
const multer = require('multer');
const Database = require('../database/database');
const QRCodeGenerator = require('../utils/qrcode');
const PDFGenerator = require('../utils/pdf-generator');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { processFileField } = require('../utils/file-helper');
const { uploadMultipleImages } = require('../utils/cloudinary');

const path = require('path');
const fs = require('fs');

// Configuration de multer pour sauvegarder les fichiers sur le disque
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = '';
    if (file.fieldname === 'photo') {
      uploadPath = './uploads/photos';
    } else if (file.fieldname === 'document_cni' || file.fieldname === 'document_carte_electeur') {
      uploadPath = './uploads/documents';
    } else {
      uploadPath = './uploads';
    }
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max par fichier
  },
  fileFilter: function (req, file, cb) {
    // Accepter seulement les images pour la photo
    if (file.fieldname === 'photo') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Seules les images sont acceptées pour la photo'));
      }
    } else {
      // Pour les documents, accepter images et PDF
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Format de fichier non supporté'));
      }
    }
  }
});

// Créer un agent (nécessite authentification)
router.post('/', authenticate, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'documents', maxCount: 10 } // Permettre jusqu'à 10 documents
]), async (req, res) => {
  try {
    // Log pour débogage
    console.log('\n📤 Nouvel agent en cours d\'enregistrement...');
    console.log('📁 Fichiers reçus:');
    console.log('  - Photo:', req.files?.photo?.[0]?.filename || 'Aucune');
    console.log('  - Documents:', req.files?.documents?.length || 0);

    // Upload de la photo vers Cloudinary
    let photoUrl = null;
    if (req.files?.photo?.[0]) {
      try {
        const photoResult = await uploadMultipleImages(
          [req.files.photo[0]],
          'idtrack/photos'
        );
        if (photoResult[0] && !photoResult[0].error) {
          photoUrl = photoResult[0].url;
        }
      } catch (error) {
        console.error('Erreur upload photo Cloudinary:', error);
      }
    }

    // Upload des documents vers Cloudinary
    let documentUrls = [];
    if (req.files?.documents && req.files.documents.length > 0) {
      try {
        const uploadResults = await uploadMultipleImages(
          req.files.documents,
          'idtrack/documents'
        );
        documentUrls = uploadResults.filter(r => !r.error);
      } catch (error) {
        console.error('Erreur upload documents Cloudinary:', error);
      }
    }

    // Préparer les données de l'agent
    const agentData = {
      ...req.body,
      photo: photoUrl
    };

    // Convertir les valeurs booléennes des checkboxes (reçues comme chaînes depuis FormData)
    const booleanFields = [
      'arrete', 'commission_affectation_sg', 'commission_affectation_locale',
      'notification_fonc_publique_ville', 'commission_local_fonc_publique_ville', 'notification_nu'
    ];
    booleanFields.forEach(field => {
      if (agentData[field] !== undefined) {
        agentData[field] = agentData[field] === 'true' || agentData[field] === true || agentData[field] === '1' || agentData[field] === 1;
      }
    });

    console.log('💾 URLs Cloudinary:');
    console.log('  - Photo:', photoUrl || 'NULL');
    console.log('  - Documents:', documentUrls.length);

    const result = await Database.addAgent(agentData);
    console.log('✅ Agent enregistré avec succès:', result.matricule);

    // Sauvegarder les documents dans la table agent_documents
    if (documentUrls.length > 0) {
      const connection = Database.getConnection();
      // Récupérer l'ID de l'agent depuis la base de données
      const [agentRows] = await connection.query(
        'SELECT id FROM agents WHERE matricule = ? OR id_agent = ?',
        [result.matricule, result.id_agent || result.id]
      );
      const agentId = agentRows[0]?.id;

      if (agentId) {
        for (let i = 0; i < documentUrls.length; i++) {
          const doc = documentUrls[i];
          try {
            await connection.query(
              `INSERT INTO agent_documents 
               (agent_id, agent_matricule, document_type, cloudinary_url, cloudinary_public_id, 
                file_name, file_size, file_format, width, height, upload_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                agentId,
                result.matricule,
                'document',
                doc.url,
                doc.public_id,
                doc.name || `Document ${i + 1}`,
                doc.bytes || null,
                doc.format || null,
                doc.width || null,
                doc.height || null,
                i
              ]
            );
          } catch (error) {
            console.error(`Erreur lors de la sauvegarde du document ${i + 1}:`, error);
          }
        }
      }
    }
    
    // Générer le QR Code sécurisé
    const qrResult = await QRCodeGenerator.generateSecureQR({
      matricule: result.matricule,
      uuid: result.uuid,
      nom: agentData.nom,
      prenom: agentData.prenom,
      categorie: agentData.categorie
    });

    // Mettre à jour l'agent avec le QR code
    const connection = Database.getConnection();
    await connection.query(
      'UPDATE agents SET qr_code = ? WHERE matricule = ?',
      [qrResult.qrData, result.matricule]
    );

    // Générer la carte PDF
    const carteData = {
      ...agentData,
      matricule: result.matricule,
      uuid: result.uuid,
      qr_code: qrResult.qrData,
      qr_code_image: qrResult.qrCodeImage
    };

    await PDFGenerator.generateCarte(carteData);

    console.log('✅ Réponse envoyée au client:', { success: true, data: result });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir tous les agents (nécessite authentification)
router.get('/', authenticate, async (req, res) => {
  try {
    const results = await Database.getAllAgents();
    // Convertir les chemins de fichiers en URLs complètes
    const agentsWithUrls = results.map(agent => {
      agent.photo = processFileField(agent.photo, req);
      agent.document_cni = processFileField(agent.document_cni, req);
      agent.document_carte_electeur = processFileField(agent.document_carte_electeur, req);
      return agent;
    });
    res.json({ success: true, data: agentsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Rechercher des agents (nécessite authentification) - DOIT être avant /:id
router.get('/search', authenticate, async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const results = await Database.searchAgents(searchTerm);
    // Convertir les chemins de fichiers en URLs complètes
    const agentsWithUrls = results.map(agent => {
      agent.photo = processFileField(agent.photo, req);
      agent.document_cni = processFileField(agent.document_cni, req);
      agent.document_carte_electeur = processFileField(agent.document_carte_electeur, req);
      return agent;
    });
    res.json({ success: true, data: agentsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir un agent par matricule (nécessite authentification) - DOIT être avant /:id
router.get('/matricule/:matricule', authenticate, async (req, res) => {
  try {
    const result = await Database.getAgentByMatricule(req.params.matricule);
    if (result) {
      // Convertir les chemins de fichiers en URLs complètes
      result.photo = processFileField(result.photo, req);
      result.document_cni = processFileField(result.document_cni, req);
      result.document_carte_electeur = processFileField(result.document_carte_electeur, req);
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ success: false, message: 'Agent non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Générer une carte PDF pour un agent (nécessite authentification) - DOIT être avant /:id
router.post('/generate-carte', authenticate, async (req, res) => {
  try {
    const result = await PDFGenerator.generateCarte(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir la carte PDF d'un agent par matricule (nécessite authentification) - DOIT être avant /:id
router.get('/carte/:matricule', authenticate, async (req, res) => {
  try {
    const matricule = req.params.matricule;
    console.log('📄 Demande de carte pour matricule:', matricule);
    
    // Récupérer l'agent
    const agent = await Database.getAgentByMatricule(matricule);
    if (!agent) {
      console.log('❌ Agent non trouvé pour matricule:', matricule);
      return res.status(404).json({ success: false, message: 'Agent non trouvé' });
    }
    
    console.log('✅ Agent trouvé:', agent.matricule);

    // Vérifier si la carte existe déjà
    const fileName = `${matricule.replace(/\//g, '-')}.pdf`;
    const exportPath = path.join(__dirname, '../exports/cartes/', fileName);
    
    if (fs.existsSync(exportPath)) {
      // Si la carte existe, la servir directement
      console.log('📄 Carte existante trouvée:', exportPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      return res.sendFile(path.resolve(exportPath));
    }
    
    console.log('📄 Carte non trouvée, génération en cours...');

    // Sinon, générer la carte
    // Traiter la photo pour la génération (convertir le chemin en données si nécessaire)
    let photoData = null;
    if (agent.photo) {
      photoData = processFileField(agent.photo, req);
      // Si c'est une URL, on devra la lire depuis le système de fichiers
      if (photoData && photoData.startsWith('http')) {
        // Extraire le chemin relatif de l'URL
        const urlPath = photoData.replace(req.protocol + '://' + req.get('host'), '');
        const filePath = path.join(__dirname, '..', urlPath);
        if (fs.existsSync(filePath)) {
          photoData = filePath;
        }
      } else if (photoData && photoData.startsWith('/uploads')) {
        // C'est déjà un chemin relatif, convertir en chemin absolu
        photoData = path.join(__dirname, '..', photoData);
      }
    }

    // Préparer les données pour la génération
    const carteData = {
      ...agent,
      matricule: agent.matricule,
      uuid: agent.uuid,
      qr_code: agent.qr_code || '',
      photo: photoData || agent.photo, // Utiliser le chemin du fichier pour la génération
    };

    // Générer le QR code si nécessaire
    if (!agent.qr_code) {
      const qrResult = await QRCodeGenerator.generateSecureQR({
        matricule: agent.matricule,
        uuid: agent.uuid,
        nom: agent.nom,
        prenom: agent.prenom,
        categorie: agent.categorie
      });
      carteData.qr_code = qrResult.qrData;
      carteData.qr_code_image = qrResult.qrCodeImage;
    }

    // Générer la carte PDF
    const generatedPath = await PDFGenerator.generateCarte(carteData);
    console.log('✅ Carte générée:', generatedPath);
    
    // Servir le fichier généré
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(path.resolve(generatedPath));
  } catch (error) {
    console.error('Erreur lors de la génération/lecture de la carte:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir un agent par ID (avec photos) (nécessite authentification)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const agent = await Database.getAgentById(id);
    if (agent) {
      // Convertir les chemins de fichiers en URLs complètes ou convertir les BLOBs en base64
      agent.photo = processFileField(agent.photo, req);
      agent.document_cni = processFileField(agent.document_cni, req);
      agent.document_carte_electeur = processFileField(agent.document_carte_electeur, req);
      
      res.json({ success: true, data: agent });
    } else {
      res.status(404).json({ success: false, message: 'Agent non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mettre à jour un agent (complet) (nécessite authentification)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    // Vérifier si l'agent existe
    const existingAgent = await Database.getAgentById(id);
    if (!existingAgent) {
      return res.status(404).json({ success: false, message: 'Agent non trouvé' });
    }

    const result = await Database.updateAgent(id, req.body);
    
    // Si le QR code doit être régénéré (si nom, prenom ou categorie changent)
    if (req.body.nom || req.body.prenom || req.body.categorie) {
      const updatedAgent = await Database.getAgentById(id);
      if (updatedAgent) {
        const qrResult = await QRCodeGenerator.generateSecureQR({
          matricule: updatedAgent.matricule,
          uuid: updatedAgent.uuid,
          nom: updatedAgent.nom,
          prenom: updatedAgent.prenom,
          categorie: updatedAgent.categorie
        });

        const connection = Database.getConnection();
        await connection.query(
          'UPDATE agents SET qr_code = ? WHERE id = ?',
          [qrResult.qrData, id]
        );
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mettre à jour un agent (partiel) (nécessite authentification)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    // Vérifier si l'agent existe
    const existingAgent = await Database.getAgentById(id);
    if (!existingAgent) {
      return res.status(404).json({ success: false, message: 'Agent non trouvé' });
    }

    const result = await Database.updateAgent(id, req.body);
    
    // Si le QR code doit être régénéré (si nom, prenom ou categorie changent)
    if (req.body.nom || req.body.prenom || req.body.categorie) {
      const updatedAgent = await Database.getAgentById(id);
      if (updatedAgent) {
        const qrResult = await QRCodeGenerator.generateSecureQR({
          matricule: updatedAgent.matricule,
          uuid: updatedAgent.uuid,
          nom: updatedAgent.nom,
          prenom: updatedAgent.prenom,
          categorie: updatedAgent.categorie
        });

        const connection = Database.getConnection();
        await connection.query(
          'UPDATE agents SET qr_code = ? WHERE id = ?',
          [qrResult.qrData, id]
        );
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Supprimer un agent (nécessite authentification admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    // Vérifier si l'agent existe
    const existingAgent = await Database.getAgentById(id);
    if (!existingAgent) {
      return res.status(404).json({ success: false, message: 'Agent non trouvé' });
    }

    const result = await Database.deleteAgent(id);
    if (result.deleted) {
      res.json({ success: true, message: 'Agent supprimé avec succès' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mettre à jour le statut d'un agent par matricule (nécessite authentification)
router.patch('/matricule/:matricule/statut', authenticate, async (req, res) => {
  try {
    const { statut } = req.body;
    
    if (!statut) {
      return res.status(400).json({ success: false, message: 'Le statut est requis' });
    }

    // Vérifier si l'agent existe
    const existingAgent = await Database.getAgentByMatricule(req.params.matricule);
    if (!existingAgent) {
      return res.status(404).json({ success: false, message: 'Agent non trouvé' });
    }

    await Database.updateAgentStatut(req.params.matricule, statut);
    res.json({ success: true, message: 'Statut mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
