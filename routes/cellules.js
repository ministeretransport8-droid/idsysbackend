const express = require('express');
const router = express.Router();
const Database = require('../database/database');

// Obtenir toutes les cellules
router.get('/', async (req, res) => {
  try {
    const results = await Database.getAllCellules();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

