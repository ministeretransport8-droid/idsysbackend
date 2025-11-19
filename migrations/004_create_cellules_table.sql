-- Migration: Créer la table cellules
-- Date: 2025-01-08
-- Description: Normalisation des cellules avec relation aux bureaux

CREATE TABLE IF NOT EXISTS cellules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  bureau_id INT,
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
  INDEX idx_bureau_id (bureau_id),
  INDEX idx_statut (statut),
  FOREIGN KEY (bureau_id) REFERENCES bureaux(id) ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY unique_cellule_bureau (nom, bureau_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

