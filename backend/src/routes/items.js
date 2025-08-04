const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data (non-blocking)
async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

// Utility to write data (non-blocking)
async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { limit = 20, page = 1, q } = req.query;

    let results = data;

    //search
    if (q) {
      results = results.filter(item =>
        item.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    const total = results.length;

    //  pagination
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = results.slice(start, end);

    res.json({
      items: paginated,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    next(err);
  }
});


// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {

    const item = req.body;     

    // Validate "name"
    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
      const err = new Error('Invalid payload: "name" is required and must be a non-empty string.');
      err.status = 400;
      throw err;
    }

    // Validate "category"
    if (!item.category || typeof item.category !== 'string' || item.category.trim() === '') {
      const err = new Error('Invalid payload: "category" is required and must be a non-empty string.');
      err.status = 400;
      throw err;
    }

    // Validate "price"
    if (typeof item.price !== 'number' || item.price <= 0) {
      const err = new Error('Invalid payload: "price" is required and must be a positive number.');
      err.status = 400;
      throw err;
    }

    const data = await readData();
    /*
    *    this code need to be changed to some other type like GUID or use some other way to generate unique id 
    */
    item.id = Date.now();
    data.push(item);
    await writeData(data);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
