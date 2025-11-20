-- Migration: Ajouter le champ post_nom à la table agents
-- Description: Ajout de la colonne post_nom (post-nom) après le champ prenom

SET @dbname = DATABASE();
SET @tablename = 'agents';
SET @columnname = 'post_nom';

SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT(
      'ALTER TABLE ', @tablename,
      ' ADD COLUMN ', @columnname,
      ' VARCHAR(100) NULL AFTER prenom'
    )
  )
);

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

