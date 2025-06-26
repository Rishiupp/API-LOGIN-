const express = require('express');
const router = express.Router();
const { pool } = require('../../dbConfig');

router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1'); //to check db
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      error: err.message
    });
  }
});

module.exports = router;
