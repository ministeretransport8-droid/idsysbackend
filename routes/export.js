const express = require('express');
const router = express.Router();
const Database = require('../database/database');
const CryptoJS = require('crypto-js');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// Importer CSV
router.post('/import-csv', async (req, res) => {
  try {
    const csvData = req.body.data; // Array of objects from CSV
    const count = await Database.importFromCSV(csvData);
    res.json({ success: true, data: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Exporter base de données (simulation - en production, exporterait vers fichier)
router.post('/export-database', async (req, res) => {
  try {
    const agents = await Database.getAllAgents();
    const data = JSON.stringify(agents);
    const encrypted = CryptoJS.AES.encrypt(data, config.security.dbEncryptionKey).toString();
    const fileName = `creuseurs_${Date.now()}.json.aes`;
    const exportPath = path.join(__dirname, '../../exports/backup', fileName);
    
    fs.writeFileSync(exportPath, encrypted);
    res.json({ success: true, data: exportPath });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Exporter en CSV
router.get('/csv', async (req, res) => {
  try {
    const agents = await Database.getAllAgents();
    let csv = 'Matricule,Nom,Prénom,Sexe,DateNaissance,LieuNaissance,Nationalité,Téléphone,Email,Adresse,Catégorie,Bureau,Cellule,Grade,Statut\n';
    agents.forEach(agent => {
      csv += `${agent.matricule},${agent.nom},${agent.prenom},${agent.sexe},${agent.date_naissance},${agent.lieu_naissance},${agent.nationalite},${agent.telephone},${agent.email || ''},${agent.adresse || ''},${agent.categorie},${agent.bureau},${agent.cellule},${agent.grade || ''},${agent.statut}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=export_agents_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

