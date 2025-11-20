const express = require('express');
const router = express.Router();
const Database = require('../database/database');
const { authenticate } = require('../middleware/auth');

// Créer une cellule (nécessite authentification)
router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, code, bureau_id, description, adresse, telephone, email, responsable, statut } = req.body;

    if (!nom) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le champ nom est requis' 
      });
    }

    const result = await Database.addCellule({
      nom,
      code,
      bureau_id,
      description,
      adresse,
      telephone,
      email,
      responsable,
      statut: statut || 'actif'
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: 'Cette cellule existe déjà pour ce bureau' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir toutes les cellules (nécessite authentification)
router.get('/', authenticate, async (req, res) => {
  try {
    const results = await Database.getAllCellules();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

