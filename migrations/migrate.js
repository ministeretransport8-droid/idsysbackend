const path = require('path');
// Charger dotenv depuis le répertoire parent (backend/)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const config = require('../config');

class MigrationRunner {
  constructor() {
    this.connection = null;
    this.pool = null;
  }

  async connect() {
    try {
      // Afficher les informations de connexion (sans le mot de passe)
      console.log(`\n🔌 Connexion à MySQL:`);
      console.log(`   Host: ${config.database.host}`);
      console.log(`   User: ${config.database.user}`);
      console.log(`   Database: ${config.database.database}`);
      console.log(`   Port: ${config.database.port}`);
      console.log(`   Password: ${config.database.password ? '***' : '(vide)'}\n`);

      // Créer la base de données si elle n'existe pas
      const tempConnection = await mysql.createConnection({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password || undefined,
        port: config.database.port
      });

      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${config.database.database}`);
      await tempConnection.end();

      // Se connecter à la base de données
      this.pool = mysql.createPool({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password || undefined,
        database: config.database.database,
        port: config.database.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: true // Permet d'exécuter plusieurs requêtes SQL
      });

      this.connection = await this.pool.getConnection();
      console.log('✓ Connexion à la base de données établie');
    } catch (error) {
      console.error('\n✗ Erreur de connexion à la base de données:', error.message);
      console.error('\n💡 Vérifiez:');
      console.error('   1. Que MySQL est en cours d\'exécution');
      console.error('   2. Les credentials dans .env ou config.json');
      console.error('   3. Que l\'utilisateur a les permissions nécessaires\n');
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.release();
    }
    if (this.pool) {
      await this.pool.end();
    }
    console.log('✓ Connexion fermée');
  }

  async ensureMigrationsTable() {
    try {
      // Vérifier si la table migrations existe
      const [tables] = await this.connection.query(
        "SHOW TABLES LIKE 'migrations'"
      );

      if (tables.length === 0) {
        // Créer la table migrations avec la première migration
        const migrationsPath = path.join(__dirname, '001_create_migrations_table.sql');
        const sql = fs.readFileSync(migrationsPath, 'utf8');
        
        // Exécuter la migration pour créer la table migrations
        await this.connection.query(sql);
        
        // Enregistrer cette migration
        await this.connection.query(
          'INSERT INTO migrations (name) VALUES (?)',
          ['001_create_migrations_table.sql']
        );
        console.log('✓ Table migrations créée');
      }
    } catch (error) {
      console.error('✗ Erreur lors de la création de la table migrations:', error.message);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const [rows] = await this.connection.query(
        'SELECT name FROM migrations ORDER BY name'
      );
      return rows.map(row => row.name);
    } catch (error) {
      return [];
    }
  }

  async getPendingMigrations() {
    try {
      const migrationsDir = __dirname;
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      const executedMigrations = await this.getExecutedMigrations();
      return files.filter(file => !executedMigrations.includes(file));
    } catch (error) {
      console.error('✗ Erreur lors de la lecture des migrations:', error.message);
      throw error;
    }
  }

  async runMigration(filename) {
    try {
      const migrationPath = path.join(__dirname, filename);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      console.log(`  → Exécution de ${filename}...`);

      // Exécuter la migration dans une transaction
      await this.connection.beginTransaction();

      try {
        // Exécuter le SQL complet directement (avec multipleStatements activé)
        // Cela permet de gérer correctement les CREATE TABLE avec plusieurs instructions
        await this.connection.query(sql);

        // Enregistrer la migration comme exécutée
        await this.connection.query(
          'INSERT INTO migrations (name) VALUES (?)',
          [filename]
        );

        await this.connection.commit();
        console.log(`  ✓ ${filename} exécutée avec succès`);
        return true;
      } catch (error) {
        await this.connection.rollback();
        throw error;
      }
    } catch (error) {
      console.error(`  ✗ Erreur lors de l'exécution de ${filename}:`, error.message);
      throw error;
    }
  }

  async runAll() {
    try {
      await this.connect();
      await this.ensureMigrationsTable();

      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        console.log('✓ Aucune migration en attente');
        return;
      }

      console.log(`\n📦 ${pendingMigrations.length} migration(s) en attente:\n`);

      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }

      console.log(`\n✓ Toutes les migrations ont été exécutées avec succès\n`);
    } catch (error) {
      console.error('\n✗ Erreur lors de l\'exécution des migrations:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }

  async status() {
    try {
      await this.connect();
      await this.ensureMigrationsTable();

      const executedMigrations = await this.getExecutedMigrations();
      const migrationsDir = __dirname;
      const allMigrations = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      console.log('\n📊 État des migrations:\n');
      console.log('Migrations exécutées:');
      executedMigrations.forEach(migration => {
        console.log(`  ✓ ${migration}`);
      });

      const pending = allMigrations.filter(m => !executedMigrations.includes(m));
      if (pending.length > 0) {
        console.log('\nMigrations en attente:');
        pending.forEach(migration => {
          console.log(`  ⏳ ${migration}`);
        });
      } else {
        console.log('\n✓ Toutes les migrations sont à jour');
      }
      console.log('');
    } catch (error) {
      console.error('✗ Erreur:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Exécution en ligne de commande
const command = process.argv[2] || 'run';

const runner = new MigrationRunner();

if (command === 'run') {
  runner.runAll();
} else if (command === 'status') {
  runner.status();
} else {
  console.log('Usage: node migrate.js [run|status]');
  console.log('  run    - Exécuter toutes les migrations en attente');
  console.log('  status - Afficher l\'état des migrations');
  process.exit(1);
}

module.exports = MigrationRunner;

