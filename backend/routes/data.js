'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const cache = require('../middleware/cache');
const { getLayer } = require('../db/queries');

const router = express.Router();

// Absolute path to the data directory (one level above backend/)
const DATA_DIR = path.resolve(__dirname, '../../data');

// Whitelist of valid layer names (security: prevents arbitrary DB/file access)
// Values are the DB layer name passed to getLayer(), and the fallback file path
// relative to DATA_DIR.
const LAYER_MAP = {
  boundary:     { dbLayer: 'boundary',            fallback: 'liberty_village.geojson' },
  parking:      { dbLayer: 'parking',             fallback: 'parking/parking_liberty.geojson' },
  greenp:       { dbLayer: 'greenp',              fallback: 'green/greenp_liberty.geojson' },
  population:   { dbLayer: 'population',          fallback: 'population.geojson' },
  rain:         { dbLayer: 'rain_gauges',         fallback: 'rain_gauges.geojson' },
  impermeable:  { dbLayer: 'impermeable_surface', fallback: 'impermeable/impermeable.geojson' },
  contours:     { dbLayer: 'contours',            fallback: 'contours/contours.geojson' },
  flood:        { dbLayer: 'flood_reports',       fallback: 'flood/flood_reporting.geojson' },
  greenstreets: { dbLayer: 'green_streets',       fallback: 'green/green_streets.geojson' },
  greenspaces:  { dbLayer: 'green_spaces',        fallback: 'green/green_spaces.geojson' },
  landcover:    { dbLayer: 'land_cover',          fallback: 'land_cover.geojson' },
  sewer:        { dbLayer: 'sewer_inlets',        fallback: 'sewer/sewer_inlets.geojson' },
};

/**
 * Read a fallback GeoJSON file with caching. Returns parsed JSON.
 * Throws if the file cannot be read.
 */
async function readFallbackFile(filePath) {
  if (cache.has(filePath)) {
    return cache.get(filePath);
  }
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  cache.set(filePath, parsed);
  return parsed;
}

// GET /api/data/:layer
router.get('/:layer', async (req, res, next) => {
  const { layer } = req.params;

  // Whitelist check — no arbitrary DB queries or file paths allowed
  if (!Object.prototype.hasOwnProperty.call(LAYER_MAP, layer)) {
    return res.status(404).json({ error: `Unknown layer: ${layer}` });
  }

  const { dbLayer, fallback } = LAYER_MAP[layer];
  const cacheKey = `layer:${layer}`;

  // Serve from in-memory cache if available
  if (cache.has(cacheKey)) {
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json(cache.get(cacheKey));
  }

  // Try PostGIS first
  try {
    const data = await getLayer(dbLayer);
    cache.set(cacheKey, data);
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json(data);
  } catch (dbErr) {
    // Fall back to file if DB is unavailable (e.g. ECONNREFUSED, ENOTFOUND)
    console.warn('DB unavailable, falling back to file for layer:', layer);

    const filePath = path.join(DATA_DIR, fallback);
    try {
      const data = await readFallbackFile(filePath);
      cache.set(cacheKey, data);
      res.set('Cache-Control', 'public, max-age=3600');
      return res.json(data);
    } catch (fileErr) {
      if (fileErr.code === 'ENOENT') {
        return res.status(404).json({ error: `Data not found for layer: ${layer}` });
      }
      next(fileErr);
    }
  }
});

module.exports = router;
