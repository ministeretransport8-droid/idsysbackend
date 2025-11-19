const express = require('express');
const router = express.Router();
const Database = require('../database/database');

// Obtenir tous les bureaux
router.get('/', async (req, res) => {
  try {
    const results = await Database.getAllBureaux();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

