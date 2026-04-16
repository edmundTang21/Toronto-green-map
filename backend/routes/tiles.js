'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const cache = require('../middleware/cache');

const router = express.Router();

// Absolute path to the trees tiles directory
const TILES_DIR = path.resolve(__dirname, '../../tiles/trees_tiles');

// Tile keys follow the pattern: optional leading dash, digits, underscore, digits
// e.g. -7913_4378  or  1234_5678
const TILE_KEY_RE = /^-?\d+_-?\d+$/;

/**
 * Read a tile file with caching. Returns parsed JSON.
 * Throws with code ENOENT if the file doesn't exist.
 */
async function readTile(filePath) {
  if (cache.has(filePath)) {
    return cache.get(filePath);
  }
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  cache.set(filePath, parsed);
  return parsed;
}

// GET /api/tiles/trees/:key
router.get('/trees/:key', async (req, res, next) => {
  const { key } = req.params;

  // Validate key format — prevents any path traversal attempt
  if (!TILE_KEY_RE.test(key)) {
    return res.status(404).json({ error: 'Tile not found' });
  }

  const filePath = path.join(TILES_DIR, `${key}.geojson`);

  // Ensure the resolved path is still inside TILES_DIR (belt-and-suspenders)
  if (!filePath.startsWith(TILES_DIR + path.sep) && filePath !== TILES_DIR) {
    return res.status(404).json({ error: 'Tile not found' });
  }

  try {
    const data = await readTile(filePath);
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Many tiles legitimately don't exist — return 404, not 500
      return res.status(404).json({ error: 'Tile not found' });
    }
    next(err);
  }
});

module.exports = router;
