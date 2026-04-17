'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs/promises');
const cache = require('./middleware/cache');
const dataRouter = require('./routes/data');
const tilesRouter = require('./routes/tiles');
const { getParkingLots, getGreenP } = require('./db/queries');

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(compression());

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET'],
}));

app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Helpers shared by full-city endpoints
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, '../data');

/**
 * Attempt to read a GeoJSON file from disk (with caching).
 * Used as a fallback when the DB is unavailable.
 */
async function readFileWithCache(filePath) {
  if (cache.has(filePath)) {
    return cache.get(filePath);
  }
  const raw = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);
  cache.set(filePath, data);
  return data;
}

/**
 * Serve a DB result (or fall back to a file) as a JSON response.
 *
 * @param {Function} dbFn          Async function that returns a GeoJSON object.
 * @param {string}   fallbackPath  Path relative to DATA_DIR used when DB fails.
 * @param {string}   cacheKey      Key used for the in-memory cache.
 */
async function serveDbOrFile(res, next, dbFn, fallbackPath, cacheKey) {
  // Serve from in-memory cache if available
  if (cache.has(cacheKey)) {
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json(cache.get(cacheKey));
  }

  // Try PostGIS first
  try {
    const data = await dbFn();
    cache.set(cacheKey, data);
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json(data);
  } catch (dbErr) {
    // Fall back to file if DB is unavailable
    console.warn('DB unavailable, falling back to file:', fallbackPath);

    const filePath = path.join(DATA_DIR, fallbackPath);
    try {
      const data = await readFileWithCache(filePath);
      cache.set(cacheKey, data);
      res.set('Cache-Control', 'public, max-age=3600');
      return res.json(data);
    } catch (fileErr) {
      if (fileErr.code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      next(fileErr);
    }
  }
}

// ---------------------------------------------------------------------------
// Full-city data endpoints
// ---------------------------------------------------------------------------

app.get('/api/parking/all', (req, res, next) => {
  serveDbOrFile(
    res, next,
    () => getParkingLots(null),
    'parking/parking_all.geojson',
    'all:parking'
  );
});

app.get('/api/green/all', (req, res, next) => {
  serveDbOrFile(
    res, next,
    () => getGreenP(null),
    'green/greenp_all.geojson',
    'all:green'
  );
});

// ---------------------------------------------------------------------------
// Tree Chinese name lookup endpoint
// ---------------------------------------------------------------------------

app.get('/api/data/trees-names-zh', (req, res, next) => {
  const filePath = path.join(DATA_DIR, 'tree_names_zh.json');
  if (cache.has(filePath)) {
    res.set('Cache-Control', 'public, max-age=86400');
    return res.json(cache.get(filePath));
  }
  fs.readFile(filePath, 'utf8')
    .then(raw => {
      const data = JSON.parse(raw);
      cache.set(filePath, data);
      res.set('Cache-Control', 'public, max-age=86400');
      res.json(data);
    })
    .catch(next);
});

// ---------------------------------------------------------------------------
// FSI raster file endpoint (serves raw GeoTIFF for use as Mapbox raster source)
// ---------------------------------------------------------------------------

const ALLOWED_RASTERS = new Set([
  'toronto-FSI-class.tif',
  'toronto-FSI-index.tif',
]);

app.get('/api/raster/:filename', (req, res) => {
  const { filename } = req.params;
  if (!ALLOWED_RASTERS.has(filename)) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.resolve(__dirname, '../data', filename));
});

// ---------------------------------------------------------------------------
// Street photos endpoints
// ---------------------------------------------------------------------------

app.use('/street-images', express.static(path.resolve(__dirname, '../data/street_images')));

app.get('/api/photos', (req, res, next) => {
  const filePath = path.join(DATA_DIR, 'street_images.geojson');
  if (cache.has('photos')) {
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json(cache.get('photos'));
  }
  fs.readFile(filePath, 'utf8')
    .then(raw => {
      const data = JSON.parse(raw);
      cache.set('photos', data);
      res.set('Cache-Control', 'public, max-age=3600');
      res.json(data);
    })
    .catch(next);
});

// ---------------------------------------------------------------------------
// Layer + tile routers
// ---------------------------------------------------------------------------

app.use('/api/data', dataRouter);
app.use('/api/tiles', tilesRouter);

// ---------------------------------------------------------------------------
// Serve frontend static files (production)
// ---------------------------------------------------------------------------

const FRONTEND_DIST = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(FRONTEND_DIST));

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') return next();
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'), err => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// ---------------------------------------------------------------------------
// 404 catch-all for unmatched API routes
// ---------------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Start server (only when not required by tests)
// ---------------------------------------------------------------------------

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Toronto Green Map API listening on port ${PORT}`);
  });
}

module.exports = app;
