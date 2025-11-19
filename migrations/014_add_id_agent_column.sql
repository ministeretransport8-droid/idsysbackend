-- Migration: Ajouter la colonne id_agent dans la table agents
-- Date: 2025-01-09
-- Description: Ajout du champ id_agent pour l'auto-incrémentation (format: MAT-AG-MT-XXXXX)

-- Vérifier et ajouter la colonne id_agent
SET @dbname = DATABASE();
SET @tablename = 'agents';
SET @columnname = 'id_agent';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) UNIQUE NULL AFTER id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Créer un index sur id_agent pour améliorer les performances
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = 'idx_id_agent')
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX idx_id_agent ON ', @tablename, ' (', @columnname, ')')
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

