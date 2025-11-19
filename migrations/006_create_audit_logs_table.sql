-- Migration: Créer la table audit_logs
-- Date: 2025-01-08
-- Description: Journalisation des actions importantes pour audit et sécurité

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INT,
  user_ip VARCHAR(45),
  user_agent TEXT,
  old_values JSON,
  new_values JSON,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action),
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

