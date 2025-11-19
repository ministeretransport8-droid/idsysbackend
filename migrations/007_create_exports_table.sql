-- Migration: Créer la table exports
-- Date: 2025-01-08
-- Description: Suivi des exports de données (CSV, backups, etc.)

CREATE TABLE IF NOT EXISTS exports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_export VARCHAR(50) NOT NULL,
  format VARCHAR(20) NOT NULL,
  file_path VARCHAR(500),
  file_size BIGINT,
  nombre_enregistrements INT,
  statut VARCHAR(20) DEFAULT 'en_cours',
  message_erreur TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_type_export (type_export),
  INDEX idx_statut (statut),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

