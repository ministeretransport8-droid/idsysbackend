-- Migration: Ajouter la colonne filiere à la table agents
-- Date: 2025-01-?? (auto-générée)
-- Description: Ajout du champ Filière

SET @dbname = DATABASE();
SET @tablename = 'agents';

-- Vérifier et ajouter la colonne filiere
SET @column_name = 'filiere';
SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @column_name
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @column_name, ' VARCHAR(100) NULL AFTER titre_academique')
  )
);

PREPARE addColumnIfNotExists FROM @preparedStatement;
EXECUTE addColumnIfNotExists;
DEALLOCATE PREPARE addColumnIfNotExists;

