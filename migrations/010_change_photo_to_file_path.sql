-- Migration: Changer le stockage des photos et documents de BLOB à chemins de fichiers
-- Date: 2025-01-08
-- Description: Modifier les colonnes photo, document_cni, document_carte_electeur pour stocker des chemins de fichiers

-- Note: Cette migration ne convertit pas les données existantes
-- Les anciennes données BLOB resteront dans la base mais ne seront plus utilisées
-- Les nouvelles données seront stockées comme chemins de fichiers

ALTER TABLE agents 
MODIFY COLUMN photo VARCHAR(500) NULL,
MODIFY COLUMN document_cni VARCHAR(500) NULL,
MODIFY COLUMN document_carte_electeur VARCHAR(500) NULL;

