const express = require('express');
const router = express.Router();
const Database = require('../database/database');
const { authenticate } = require('../middleware/auth');

// Créer une catégorie professionnelle (nécessite authentification)
router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, code, description, niveau_hierarchique, statut } = req.body;

    if (!nom) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le champ nom est requis' 
      });
    }

    const result = await Database.createCategorieProfessionnelle({
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
        message: 'Cette catégorie professionnelle existe déjà' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir toutes les catégories professionnelles (nécessite authentification)
router.get('/', authenticate, async (req, res) => {
  try {
    const results = await Database.getAllCategoriesProfessionnelles();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir une catégorie professionnelle par ID (nécessite authentification)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const result = await Database.getCategorieProfessionnelleById(id);
    if (result) {
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ success: false, message: 'Catégorie professionnelle non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mettre à jour une catégorie professionnelle (nécessite authentification)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const existingCategorie = await Database.getCategorieProfessionnelleById(id);
    if (!existingCategorie) {
      return res.status(404).json({ success: false, message: 'Catégorie professionnelle non trouvée' });
    }

    const result = await Database.updateCategorieProfessionnelle(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: 'Cette catégorie professionnelle existe déjà' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Supprimer une catégorie professionnelle (nécessite authentification)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const existingCategorie = await Database.getCategorieProfessionnelleById(id);
    if (!existingCategorie) {
      return res.status(404).json({ success: false, message: 'Catégorie professionnelle non trouvée' });
    }

    const result = await Database.deleteCategorieProfessionnelle(id);
    if (result.deleted) {
      res.json({ success: true, message: 'Catégorie professionnelle supprimée avec succès' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

