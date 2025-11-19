-- Migration: Créer la table bureaux
-- Date: 2025-01-08
-- Description: Normalisation des bureaux pour éviter les doublons et faciliter la gestion

CREATE TABLE IF NOT EXISTS bureaux (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(255),
  responsable VARCHAR(255),
  statut VARCHAR(20) DEFAULT 'actif',
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nom (nom),
  INDEX idx_code (code),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

