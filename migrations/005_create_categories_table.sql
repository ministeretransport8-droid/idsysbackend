-- Migration: Créer la table categories
-- Date: 2025-01-08
-- Description: Normalisation des catégories d'agents

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  niveau_hierarchique INT DEFAULT 0,
  statut VARCHAR(20) DEFAULT 'actif',
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nom (nom),
  INDEX idx_code (code),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer les catégories par défaut
INSERT INTO categories (nom, code, niveau_hierarchique) VALUES
('Chef de bureau', 'CHEF_BUREAU', 1),
('Chef de cellule', 'CHEF_CELLULE', 2),
('Superviseur', 'SUPERVISEUR', 3),
('Relais terrain', 'RELAIS_TERRAIN', 4),
('Taxateur', 'TAXATEUR', 5),
('Contrôleur', 'CONTROLEUR', 5),
('Inspecteur', 'INSPECTEUR', 3)
ON DUPLICATE KEY UPDATE nom=nom;

