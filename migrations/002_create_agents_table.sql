-- Migration: Créer la table agents
-- Date: 2025-01-08

CREATE TABLE IF NOT EXISTS agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricule VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  sexe VARCHAR(10),
  date_naissance DATE,
  lieu_naissance VARCHAR(255),
  nationalite VARCHAR(100) DEFAULT 'Congolaise',
  telephone VARCHAR(20),
  email VARCHAR(255),
  adresse TEXT,
  photo LONGBLOB,
  categorie VARCHAR(100) NOT NULL,
  bureau VARCHAR(255),
  cellule VARCHAR(255),
  grade VARCHAR(100),
  empreinte_digitale TEXT,
  document_cni LONGBLOB,
  document_carte_electeur LONGBLOB,
  qr_code TEXT,
  uuid VARCHAR(36) UNIQUE,
  statut VARCHAR(20) DEFAULT 'actif',
  date_enregistrement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_matricule (matricule),
  INDEX idx_uuid (uuid),
  INDEX idx_nom_prenom (nom, prenom),
  INDEX idx_bureau (bureau),
  INDEX idx_cellule (cellule),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

