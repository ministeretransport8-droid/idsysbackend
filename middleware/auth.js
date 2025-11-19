const jwt = require('jsonwebtoken');
const Database = require('../database/database');
const config = require('../config');

// Clé secrète pour JWT (utiliser une variable d'environnement en production)
const JWT_SECRET = process.env.JWT_SECRET || config.security.dbEncryptionKey || 'IdTrackSecretKey2024';

/**
 * Middleware d'authentification - Vérifie le token JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization ou depuis les paramètres de requête
    let token = null;
    
    // Essayer d'abord depuis le header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader) {
      // Format: "Bearer <token>"
      token = authHeader.split(' ')[1];
    }
    
    // Si pas de token dans le header, essayer depuis les paramètres de requête (pour window.open)
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token d\'authentification manquant' 
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Vérifier si l'utilisateur existe toujours et est actif
    const user = await Database.getUtilisateurById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    if (user.statut !== 'actif') {
      return res.status(403).json({ 
        success: false, 
        message: 'Compte utilisateur désactivé' 
      });
    }

    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role
    };

    next();
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
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur d\'authentification: ' + error.message 
    });
  }
};

/**
 * Middleware de vérification de rôle - Vérifie si l'utilisateur a le rôle requis
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentification requise' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès refusé. Rôle insuffisant.' 
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
const requireAdmin = requireRole('admin');

/**
 * Générer un token JWT
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  // Token valide pendant 24 heures
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = {
  authenticate,
  requireRole,
  requireAdmin,
  generateToken,
  JWT_SECRET
};

