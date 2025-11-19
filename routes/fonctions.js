const express = require('express');
const router = express.Router();
const Database = require('../database/database');
const { authenticate } = require('../middleware/auth');

// Créer une fonction (nécessite authentification)
router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, code, description, statut } = req.body;

    if (!nom) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le champ nom est requis' 
      });
    }

    const result = await Database.createFonction({
      nom,
      code,
      description,
      statut: statut || 'actif'
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: 'Cette fonction existe déjà' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir toutes les fonctions (nécessite authentification)
router.get('/', authenticate, async (req, res) => {
  try {
    const results = await Database.getAllFonctions();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir une fonction par ID (nécessite authentification)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const result = await Database.getFonctionById(id);
    if (result) {
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ success: false, message: 'Fonction non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mettre à jour une fonction (nécessite authentification)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const existingFonction = await Database.getFonctionById(id);
    if (!existingFonction) {
      return res.status(404).json({ success: false, message: 'Fonction non trouvée' });
    }

    const result = await Database.updateFonction(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: 'Cette fonction existe déjà' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Supprimer une fonction (nécessite authentification)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const existingFonction = await Database.getFonctionById(id);
    if (!existingFonction) {
      return res.status(404).json({ success: false, message: 'Fonction non trouvée' });
    }

    const result = await Database.deleteFonction(id);
    if (result.deleted) {
      res.json({ success: true, message: 'Fonction supprimée avec succès' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

