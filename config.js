require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Charger config.json comme fallback
let configJson = {};
const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  configJson = require('./config.json');
}

// Configuration avec variables d'environnement (priorité) ou config.json (fallback)
const config = {
  security: {
    adminPassword: process.env.ADMIN_PASSWORD || configJson.security?.adminPassword || 'Transport2024!',
    dbEncryptionKey: process.env.DB_ENCRYPTION_KEY || configJson.security?.dbEncryptionKey || 'IdTrackTransportKinshasa2024SecretKey'
  },
  database: {
    host: process.env.DB_HOST || configJson.database?.host || 'localhost',
    user: process.env.DB_USER || configJson.database?.user || 'root',
    // Gérer le cas où DB_PASSWORD est une chaîne vide dans .env
    password: (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== '') 
      ? process.env.DB_PASSWORD 
      : (configJson.database?.password || ''),
    database: process.env.DB_NAME || configJson.database?.database || 'idtrack_db',
    port: parseInt(process.env.DB_PORT) || configJson.database?.port || 3306
  },
  app: {
    title: configJson.app?.title || 'IdTrack - Identification Agents Terrain',
    version: configJson.app?.version || '1.0.0',
    province: configJson.app?.province || 'Ministère Provincial de Transport et Mobilité Urbaine - Kinshasa'
  },
  idFormat: {
    prefix: process.env.ID_PREFIX || configJson.idFormat?.prefix || 'MPTMU-KIN',
    startNumber: parseInt(process.env.ID_START_NUMBER) || configJson.idFormat?.startNumber || 1,
    padding: parseInt(process.env.ID_PADDING) || configJson.idFormat?.padding || 6
  },
  export: {
    cartesPath: process.env.EXPORT_CARTES_PATH || configJson.export?.cartesPath || './exports/cartes/',
    csvPath: process.env.EXPORT_CSV_PATH || configJson.export?.csvPath || './exports/csv/',
    backupPath: process.env.EXPORT_BACKUP_PATH || configJson.database?.backupPath || './exports/backup/'
  },
  colors: {
    primary: configJson.colors?.primary || '#00A896',
    background: configJson.colors?.background || '#F0F0F0',
    cardBg: configJson.colors?.cardBg || '#FFFFFF',
    inactive: configJson.colors?.inactive || '#E0E0E0',
    text: configJson.colors?.text || '#333333'
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || configJson.cloudinary?.cloud_name || 'root',
    api_key: process.env.CLOUDINARY_API_KEY || configJson.cloudinary?.api_key || '172267485622925',
    api_secret: process.env.CLOUDINARY_API_SECRET || configJson.cloudinary?.api_secret || '6IkagV_iy4ms1XTRGJ-m8CEroi8'
  }
};

module.exports = config;

