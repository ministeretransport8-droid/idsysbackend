require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const config = require('../config');

async function exportDatabase() {
  try {
    console.log('📦 Début de l\'export de la base de données...\n');

    const dbConfig = config.database;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `idtrack_db_backup_${timestamp}.sql`;
    const exportPath = path.join(__dirname, '../exports/backup', fileName);

    // Créer le dossier si nécessaire
    const backupDir = path.dirname(exportPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Vérifier si mysqldump est disponible
    try {
      await execAsync('which mysqldump');
    } catch (error) {
      console.log('⚠️  mysqldump non trouvé, utilisation de l\'export manuel...\n');
      return await exportManual(dbConfig, exportPath);
    }

    // Utiliser mysqldump pour l'export
    const passwordArg = dbConfig.password ? `-p${dbConfig.password}` : '';
    const mysqldumpCmd = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} ${passwordArg} ${dbConfig.database} > "${exportPath}"`;

    console.log('🔄 Export avec mysqldump...');
    await execAsync(mysqldumpCmd, { maxBuffer: 10 * 1024 * 1024 });

    const stats = fs.statSync(exportPath);
    console.log(`✅ Export réussi !`);
    console.log(`   Fichier: ${fileName}`);
    console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Chemin: ${exportPath}\n`);

    return exportPath;
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error.message);
    // Essayer l'export manuel en cas d'échec
    console.log('🔄 Tentative d\'export manuel...\n');
    try {
      const dbConfig = config.database;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                       new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `idtrack_db_backup_${timestamp}.sql`;
      const exportPath = path.join(__dirname, '../exports/backup', fileName);
      return await exportManual(dbConfig, exportPath);
    } catch (manualError) {
      console.error('❌ Erreur lors de l\'export manuel:', manualError.message);
      throw manualError;
    }
  }
}

async function exportManual(dbConfig, exportPath) {
  try {
    console.log('🔄 Export manuel de la base de données...\n');

    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password || undefined,
      database: dbConfig.database,
      port: dbConfig.port
    });

    let sqlContent = `-- Export de la base de données ${dbConfig.database}\n`;
    sqlContent += `-- Date: ${new Date().toISOString()}\n`;
    sqlContent += `-- Généré automatiquement\n\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS=0;\n`;
    sqlContent += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
    sqlContent += `SET AUTOCOMMIT = 0;\n`;
    sqlContent += `START TRANSACTION;\n`;
    sqlContent += `SET time_zone = "+00:00";\n\n`;

    // Obtenir toutes les tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);

    console.log(`📋 Tables trouvées: ${tableNames.length}\n`);

    for (const tableName of tableNames) {
      console.log(`   Export de la table: ${tableName}...`);

      // Obtenir la structure de la table
      const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSQL = createTable[0]['Create Table'];

      sqlContent += `\n-- --------------------------------------------------------\n`;
      sqlContent += `-- Structure de la table \`${tableName}\`\n`;
      sqlContent += `-- --------------------------------------------------------\n\n`;
      sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlContent += `${createTableSQL};\n\n`;

      // Obtenir les données de la table
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);

      if (rows.length > 0) {
        sqlContent += `-- --------------------------------------------------------\n`;
        sqlContent += `-- Données de la table \`${tableName}\`\n`;
        sqlContent += `-- --------------------------------------------------------\n\n`;

        // Obtenir les noms des colonnes
        const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
        const columnNames = columns.map(col => col.Field);

        // Générer les INSERT statements
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const values = batch.map(row => {
            const rowValues = columnNames.map(col => {
              const value = row[col];
              if (value === null || value === undefined) {
                return 'NULL';
              } else if (Buffer.isBuffer(value)) {
                // Pour les BLOBs, convertir en hex
                return `0x${value.toString('hex')}`;
              } else if (typeof value === 'string') {
                // Échapper les caractères spéciaux
                return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              } else if (typeof value === 'number') {
                return value;
              } else if (value instanceof Date) {
                return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
              } else {
                return `'${String(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              }
            });
            return `(${rowValues.join(', ')})`;
          });

          sqlContent += `INSERT INTO \`${tableName}\` (\`${columnNames.join('`, `')}\`) VALUES\n`;
          sqlContent += values.join(',\n') + ';\n\n';
        }

        console.log(`      ✓ ${rows.length} enregistrements exportés`);
      } else {
        console.log(`      ✓ Table vide`);
      }
    }

    sqlContent += `SET FOREIGN_KEY_CHECKS=1;\n`;
    sqlContent += `COMMIT;\n`;

    // Écrire le fichier
    fs.writeFileSync(exportPath, sqlContent, 'utf8');

    await connection.end();

    const stats = fs.statSync(exportPath);
    console.log(`\n✅ Export manuel réussi !`);
    console.log(`   Fichier: ${path.basename(exportPath)}`);
    console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Chemin: ${exportPath}\n`);

    return exportPath;
  } catch (error) {
    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  exportDatabase()
    .then((filePath) => {
      console.log('✨ Export terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { exportDatabase };

