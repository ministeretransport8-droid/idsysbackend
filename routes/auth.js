const express = require('express');
const router = express.Router();
const Database = require('../database/database');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Authentification avec username/email et mot de passe
 */
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier qu'au moins username ou email est fourni
    if (!username && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username ou email requis' 
      });
    }

    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mot de passe requis' 
      });
    }

    // Récupérer l'utilisateur par username ou email
    let user = null;
    if (username) {
      user = await Database.getUtilisateurByUsername(username);
    } else if (email) {
      user = await Database.getUtilisateurByEmail(email);
    }

    // Vérifier si l'utilisateur existe
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiants incorrects' 
      });
    }

    // Vérifier si le compte est actif
    if (user.statut !== 'actif') {
      return res.status(403).json({ 
        success: false, 
        message: 'Compte désactivé. Contactez l\'administrateur.' 
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = Database.verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiants incorrects' 
      });
    }

    // Mettre à jour la dernière connexion
    await Database.updateDerniereConnexion(user.id);

    // Générer le token JWT
    const token = generateToken(user);

    // Retourner les informations de l'utilisateur (sans le mot de passe) et le token
    res.json({
      success: true,
      message: 'Authentification réussie',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          telephone: user.telephone,
          statut: user.statut
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'authentification: ' + error.message 
    });
  }
});

/**
 * POST /api/auth/verify
 * Vérifier si un token est valide
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token requis' 
      });
    }

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Récupérer les informations de l'utilisateur
      const user = await Database.getUtilisateurById(decoded.userId);
      
      if (!user || user.statut !== 'actif') {
        return res.status(401).json({ 
          success: false, 
          message: 'Utilisateur invalide ou désactivé' 
        });
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role
          }
        }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token invalide' 
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expiré' 
        });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification: ' + error.message 
    });
  }
});

/**
 * GET /api/auth/me
 * Obtenir les informations de l'utilisateur connecté
 * (nécessite une authentification)
 */
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const user = await Database.getUtilisateurById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        telephone: user.telephone,
        statut: user.statut,
        date_creation: user.date_creation,
        derniere_connexion: user.derniere_connexion
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des informations: ' + error.message 
    });
  }
});

module.exports = router;
