-- Migration: Ajouter le champ situation_prime à la table agents
-- Date: 2025-01-?? (auto-générée)
-- Description: Ajout du champ situation_prime pour stocker l'information "Primé" ou "Non Primé"

SET @dbname = DATABASE();
SET @tablename = 'agents';
SET @columnname = 'situation_prime';

SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT(
      'ALTER TABLE ', @tablename,
      ' ADD COLUMN ', @columnname,
      ' VARCHAR(10) NULL DEFAULT \'NP\' AFTER statut'
    )
  )
);

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Valeurs attendues :
--   P   -> Primé
--   NP  -> Non Primé

