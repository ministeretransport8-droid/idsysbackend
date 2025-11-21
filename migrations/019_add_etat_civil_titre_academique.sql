-- Migration: Ajouter les colonnes etat_civil et titre_academique à la table agents
-- Date: 2025-01-?? (auto-générée)
-- Description: Ajout des champs État Civil et Titre Académique

SET @dbname = DATABASE();
SET @tablename = 'agents';

-- Vérifier et ajouter la colonne etat_civil
SET @column_name = 'etat_civil';
SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @column_name
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @column_name, ' VARCHAR(50) NULL AFTER sexe')
  )
);

PREPARE addColumnIfNotExists FROM @preparedStatement;
EXECUTE addColumnIfNotExists;
DEALLOCATE PREPARE addColumnIfNotExists;

-- Vérifier et ajouter la colonne titre_academique
SET @column_name = 'titre_academique';
SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @column_name
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @column_name, ' VARCHAR(100) NULL AFTER etat_civil')
  )
);

PREPARE addColumnIfNotExists FROM @preparedStatement;
EXECUTE addColumnIfNotExists;
DEALLOCATE PREPARE addColumnIfNotExists;

