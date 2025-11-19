const express = require('express');
const router = express.Router();
const Database = require('../database/database');
const { authenticate } = require('../middleware/auth');

// Créer un grade (nécessite authentification)
router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, code, description, niveau_hierarchique, statut } = req.body;

    if (!nom) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le champ nom est requis' 
      });
    }

    const result = await Database.createGrade({
      nom,
      code,
      description,
      niveau_hierarchique,
      statut: statut || 'actif'
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: 'Ce grade existe déjà' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir tous les grades (nécessite authentification)
router.get('/', authenticate, async (req, res) => {
  try {
    const results = await Database.getAllGrades();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir un grade par ID (nécessite authentification)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const result = await Database.getGradeById(id);
    if (result) {
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ success: false, message: 'Grade non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mettre à jour un grade (nécessite authentification)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const existingGrade = await Database.getGradeById(id);
    if (!existingGrade) {
      return res.status(404).json({ success: false, message: 'Grade non trouvé' });
    }

    const result = await Database.updateGrade(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: 'Ce grade existe déjà' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Supprimer un grade (nécessite authentification)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const existingGrade = await Database.getGradeById(id);
    if (!existingGrade) {
      return res.status(404).json({ success: false, message: 'Grade non trouvé' });
    }

    const result = await Database.deleteGrade(id);
    if (result.deleted) {
      res.json({ success: true, message: 'Grade supprimé avec succès' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

