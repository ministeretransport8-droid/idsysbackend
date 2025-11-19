require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function fixTables() {
  let connection = null;
  
  try {
    console.log('\n🔧 Réparation des tables...\n');
    
    // Se connecter à la base de données
    connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password || undefined,
      database: config.database.database,
      port: config.database.port,
      multipleStatements: true // Permet d'exécuter plusieurs requêtes
    });

    console.log('✓ Connexion établie\n');

    // Liste des migrations à exécuter (sans la première qui crée la table migrations)
    const migrations = [
      '002_create_agents_table.sql',
      '003_create_bureaux_table.sql',
      '004_create_cellules_table.sql',
      '005_create_categories_table.sql',
      '006_create_audit_logs_table.sql',
      '007_create_exports_table.sql',
      '008_create_sessions_table.sql'
    ];

    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Fichier ${migrationFile} non trouvé, ignoré`);
        continue;
      }

      console.log(`📦 Exécution de ${migrationFile}...`);
      
      try {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Exécuter le SQL complet (avec multipleStatements activé)
        await connection.query(sql);
        
        console.log(`  ✓ ${migrationFile} exécutée avec succès\n`);
      } catch (error) {
        // Si la table existe déjà, c'est OK
        if (error.message.includes('already exists') || error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`  ⚠️  Table déjà existante, ignoré\n`);
        } else {
          console.error(`  ✗ Erreur: ${error.message}\n`);
        }
      }
    }

    // Vérifier les tables créées
    console.log('📊 Vérification des tables...\n');
    const [tables] = await connection.query('SHOW TABLES');
    
    console.log(`✓ ${tables.length} table(s) trouvée(s):\n`);
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });
    
    console.log('\n✅ Réparation terminée avec succès\n');
    
  } catch (error) {
    console.error('\n✗ Erreur lors de la réparation:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixTables();

