const express = require('express');
const router = express.Router();
const Database = require('../database/database');
const { authenticate } = require('../middleware/auth');

// Obtenir tous les bureaux
router.get('/', authenticate, async (req, res) => {
  try {
    const results = await Database.getAllBureaux();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Créer un bureau
router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, code, description, adresse, telephone, email, responsable, statut } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le champ nom est requis'
      });
    }

    const result = await Database.addBureau({
      nom: nom.trim(),
      code: code ? code.trim() : null,
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
        message: 'Un bureau avec ce nom ou ce code existe déjà'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

