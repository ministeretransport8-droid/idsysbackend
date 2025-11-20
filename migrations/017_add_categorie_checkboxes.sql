-- Migration: Ajouter les colonnes pour les checkboxes de catégorie
-- Date: 2025-01-?? (auto-générée)
-- Description: Ajout des colonnes pour les options de "sous statut" et "nouvelle unité"

SET @dbname = DATABASE();
SET @tablename = 'agents';

-- Colonnes pour "sous statut"
SET @columnname = 'arrete';
SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 AFTER situation_prime')
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'commission_affectation_sg';
SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 AFTER arrete')
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'commission_affectation_locale';
SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 AFTER commission_affectation_sg')
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'notification_fonc_publique_ville';
SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 AFTER commission_affectation_locale')
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Colonnes pour "nouvelle unité"
SET @columnname = 'commission_local_fonc_publique_ville';
SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 AFTER notification_fonc_publique_ville')
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'notification_nu';
SET @preparedStatement = (
  SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = @tablename
        AND table_schema = @dbname
        AND column_name = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 AFTER commission_local_fonc_publique_ville')
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

