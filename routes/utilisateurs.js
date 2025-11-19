const express = require('express');
const router = express.Router();
const Database = require('../database/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Créer un utilisateur (nécessite authentification admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, nom, prenom, role, telephone, statut } = req.body;

    // Validation des champs requis
    if (!username || !email || !password || !nom || !prenom) {
      return res.status(400).json({ 
        success: false, 
        message: 'Les champs username, email, password, nom et prenom sont requis' 
      });
    }

    // Vérifier si l'username existe déjà
    const existingUser = await Database.getUtilisateurByUsername(username);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ce nom d\'utilisateur existe déjà' 
      });
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await Database.getUtilisateurByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        message: 'Cet email existe déjà' 
      });
    }

    const result = await Database.createUtilisateur({
      username,
      email,
      password,
      nom,
      prenom,
      role: role || 'user',
      telephone,
      statut: statut || 'actif'
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir tous les utilisateurs (nécessite authentification)
router.get('/', authenticate, async (req, res) => {
  try {
    const results = await Database.getAllUtilisateurs();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtenir un utilisateur par ID (nécessite authentification)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const result = await Database.getUtilisateurById(id);
    if (result) {
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mettre à jour un utilisateur (nécessite authentification - admin ou propriétaire)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await Database.getUtilisateurById(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Vérifier les permissions : admin peut modifier n'importe qui, utilisateur peut modifier son propre compte
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'avez pas la permission de modifier cet utilisateur' 
      });
    }

    // Vérifier si le nouveau username existe déjà (si modifié)
    if (req.body.username && req.body.username !== existingUser.username) {
      const userWithUsername = await Database.getUtilisateurByUsername(req.body.username);
      if (userWithUsername) {
        return res.status(409).json({ 
          success: false, 
          message: 'Ce nom d\'utilisateur existe déjà' 
        });
      }
    }

    // Vérifier si le nouvel email existe déjà (si modifié)
    if (req.body.email && req.body.email !== existingUser.email) {
      const userWithEmail = await Database.getUtilisateurByEmail(req.body.email);
      if (userWithEmail) {
        return res.status(409).json({ 
          success: false, 
          message: 'Cet email existe déjà' 
        });
      }
    }

    const result = await Database.updateUtilisateur(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mettre à jour partiellement un utilisateur (nécessite authentification - admin ou propriétaire)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await Database.getUtilisateurById(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Vérifier les permissions : admin peut modifier n'importe qui, utilisateur peut modifier son propre compte
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'avez pas la permission de modifier cet utilisateur' 
      });
    }

    // Les utilisateurs non-admin ne peuvent pas modifier leur rôle
    if (req.user.role !== 'admin' && req.body.role !== undefined) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'avez pas la permission de modifier le rôle' 
      });
    }

    // Vérifier si le nouveau username existe déjà (si modifié)
    if (req.body.username && req.body.username !== existingUser.username) {
      const userWithUsername = await Database.getUtilisateurByUsername(req.body.username);
      if (userWithUsername) {
        return res.status(409).json({ 
          success: false, 
          message: 'Ce nom d\'utilisateur existe déjà' 
        });
      }
    }

    // Vérifier si le nouvel email existe déjà (si modifié)
    if (req.body.email && req.body.email !== existingUser.email) {
      const userWithEmail = await Database.getUtilisateurByEmail(req.body.email);
      if (userWithEmail) {
        return res.status(409).json({ 
          success: false, 
          message: 'Cet email existe déjà' 
        });
      }
    }

    const result = await Database.updateUtilisateur(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Supprimer un utilisateur (nécessite authentification admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await Database.getUtilisateurById(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const result = await Database.deleteUtilisateur(id);
    if (result.deleted) {
      res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

