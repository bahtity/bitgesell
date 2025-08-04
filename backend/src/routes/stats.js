const express = require('express');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../data/items.json');

let cachedStats = null;
let lastModifiedTime = null;

// Watch file changes to invalidate cache
fs.watchFile(DATA_PATH, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log('items.json changed — invalidating stats cache');
    cachedStats = null;
    lastModifiedTime = curr.mtime;
  }
});

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    if (cachedStats) {
      return res.json(cachedStats);
    }

    const raw = await fsp.readFile(DATA_PATH, 'utf-8');
    const items = JSON.parse(raw);

    const stats = {
      total: items.length,
      averagePrice:
        items.length > 0
          ? items.reduce((acc, cur) => acc + cur.price, 0) / items.length
          : 0
    };

    cachedStats = stats;
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
