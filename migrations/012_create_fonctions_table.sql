-- Migration: Créer la table fonctions
-- Date: 2025-01-09
-- Description: Normalisation des fonctions professionnelles

CREATE TABLE IF NOT EXISTS fonctions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  statut VARCHAR(20) DEFAULT 'actif',
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nom (nom),
  INDEX idx_code (code),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer quelques fonctions par défaut
INSERT INTO fonctions (nom, code) VALUES
('Gestionnaire', 'GESTIONNAIRE'),
('Comptable', 'COMPTABLE'),
('Secrétaire', 'SECRETAIRE'),
('Chauffeur', 'CHAUFFEUR'),
('Agent de terrain', 'AGENT_TERRAIN'),
('Contrôleur', 'CONTROLEUR'),
('Inspecteur', 'INSPECTEUR'),
('Superviseur', 'SUPERVISEUR')
ON DUPLICATE KEY UPDATE nom=nom;

