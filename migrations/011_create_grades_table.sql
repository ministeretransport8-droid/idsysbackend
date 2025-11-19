-- Migration: Créer la table grades
-- Date: 2025-01-09
-- Description: Normalisation des grades professionnels

CREATE TABLE IF NOT EXISTS grades (
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

-- Insérer quelques grades par défaut
INSERT INTO grades (nom, code, niveau_hierarchique) VALUES
('Directeur', 'DIRECTEUR', 1),
('Sous-directeur', 'SOUS_DIRECTEUR', 2),
('Chef de service', 'CHEF_SERVICE', 3),
('Chef de bureau', 'CHEF_BUREAU', 4),
('Chef de cellule', 'CHEF_CELLULE', 5),
('Superviseur', 'SUPERVISEUR', 6),
('Agent principal', 'AGENT_PRINCIPAL', 7),
('Agent', 'AGENT', 8)
ON DUPLICATE KEY UPDATE nom=nom;

