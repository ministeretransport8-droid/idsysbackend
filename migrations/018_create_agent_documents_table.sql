-- Migration: Créer la table agent_documents pour stocker les documents Cloudinary
-- Date: 2025-01-?? (auto-générée)
-- Description: Table pour stocker les URLs Cloudinary des documents/images uploadés

SET @dbname = DATABASE();
SET @tablename = 'agent_documents';

SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
      WHERE table_name = @tablename
        AND table_schema = @dbname
    ) > 0,
    'SELECT 1',
    CONCAT(
      'CREATE TABLE IF NOT EXISTS ', @tablename, ' (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id INT,
        agent_matricule VARCHAR(50),
        document_type VARCHAR(50) DEFAULT ''document'',
        cloudinary_url VARCHAR(500) NOT NULL,
        cloudinary_public_id VARCHAR(255) NOT NULL,
        file_name VARCHAR(255),
        file_size INT,
        file_format VARCHAR(10),
        width INT,
        height INT,
        upload_order INT DEFAULT 0,
        date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_agent_id (agent_id),
        INDEX idx_agent_matricule (agent_matricule),
        INDEX idx_document_type (document_type),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    )
  )
);

PREPARE createIfNotExists FROM @preparedStatement;
EXECUTE createIfNotExists;
DEALLOCATE PREPARE createIfNotExists;

