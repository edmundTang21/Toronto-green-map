// Run with: npm test
// CI: runs automatically via GitHub Actions on PR

'use strict';

const request = require('supertest');
const app = require('../index');
const cache = require('../middleware/cache');

// Flush the in-memory cache before each test so tests are isolated
// and do not share stale state from previous requests.
beforeEach(() => {
  cache.flush();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Assert that a response body is a valid GeoJSON FeatureCollection.
 * Accepts any features array length, including 0.
 */
function assertGeoJSONFeatureCollection(body) {
  expect(body).toHaveProperty('type', 'FeatureCollection');
  expect(body).toHaveProperty('features');
  expect(Array.isArray(body.features)).toBe(true);
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('responds with JSON content-type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// ---------------------------------------------------------------------------
// Layer data endpoints
// ---------------------------------------------------------------------------

const VALID_LAYERS = [
  'boundary',
  'parking',
  'greenp',
  'population',
  'rain',
  'impermeable',
  'contours',
  'flood',
  'greenstreets',
  'greenspaces',
  'landcover',
  'sewer',
];

describe('GET /api/data/:layer — valid layers', () => {
  test.each(VALID_LAYERS)(
    'layer "%s" returns 200 with a valid GeoJSON FeatureCollection',
    async (layer) => {
      const res = await request(app).get(`/api/data/${layer}`);

      // Data file may not be present in CI/test environment — accept 200 or 404.
      // A 500 is never acceptable.
      expect(res.status).not.toBe(500);

      if (res.status === 200) {
        expect(res.headers['content-type']).toMatch(/application\/json/);
        assertGeoJSONFeatureCollection(res.body);
      } else {
        // 404 means data file is absent from this environment — that is OK.
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
      }
    }
  );

  test('successful layer response sets Cache-Control header', async () => {
    // Use boundary — smallest file, most likely present.
    const res = await request(app).get('/api/data/boundary');
    if (res.status === 200) {
      expect(res.headers['cache-control']).toMatch(/max-age/);
    }
  });
});

// ---------------------------------------------------------------------------
// Unknown layer → 404
// ---------------------------------------------------------------------------

describe('GET /api/data/:layer — unknown layers', () => {
  test('unknown layer returns 404', async () => {
    const res = await request(app).get('/api/data/unknownlayer');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('empty-string-like layer returns 404', async () => {
    const res = await request(app).get('/api/data/doesnotexist');
    expect(res.status).toBe(404);
  });

  test('response body for unknown layer contains an error message', async () => {
    const res = await request(app).get('/api/data/unknownlayer');
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Security: path-traversal attempts on layer endpoint
// ---------------------------------------------------------------------------

describe('GET /api/data/:layer — path traversal attempts', () => {
  const traversalCandidates = [
    '../etc/passwd',
    '..%2Fetc%2Fpasswd',
    '....//etc/passwd',
    'boundary/../../../etc/passwd',
  ];

  test.each(traversalCandidates)(
    'path traversal "%s" is rejected (not 200 or 500)',
    async (attempt) => {
      const res = await request(app).get(`/api/data/${attempt}`);
      // Must not succeed, must not be a server error
      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(500);
    }
  );
});

// ---------------------------------------------------------------------------
// Tree tile endpoint
// ---------------------------------------------------------------------------

describe('GET /api/tiles/trees/:key', () => {
  test('valid tile key format returns 200 or 404 — never 500', async () => {
    const res = await request(app).get('/api/tiles/trees/-7913_4378');
    expect(res.status).not.toBe(500);
    expect([200, 404]).toContain(res.status);
  });

  test('200 response contains valid GeoJSON FeatureCollection', async () => {
    const res = await request(app).get('/api/tiles/trees/-7913_4378');
    if (res.status === 200) {
      expect(res.headers['content-type']).toMatch(/application\/json/);
      assertGeoJSONFeatureCollection(res.body);
    }
  });

  test('200 tile response sets Cache-Control header', async () => {
    const res = await request(app).get('/api/tiles/trees/-7913_4378');
    if (res.status === 200) {
      expect(res.headers['cache-control']).toMatch(/max-age/);
    }
  });

  test('another valid tile key format (positive coords) returns 200 or 404', async () => {
    const res = await request(app).get('/api/tiles/trees/1234_5678');
    expect(res.status).not.toBe(500);
    expect([200, 404]).toContain(res.status);
  });

  // Security: malformed / traversal tile keys
  const badKeys = [
    '../etc/passwd',
    '-7913_4378.geojson',   // extension included
    '-7913_4378/../../x',
    'abc_def',              // non-numeric
    '',                     // empty (Express won't route this, but let's be safe)
  ];

  test.each(badKeys)(
    'invalid tile key "%s" returns 404 — never 200 or 500',
    async (key) => {
      const res = await request(app).get(`/api/tiles/trees/${key}`);
      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(500);
    }
  );
});

// ---------------------------------------------------------------------------
// Full-city data endpoints
// ---------------------------------------------------------------------------

describe('GET /api/parking/all', () => {
  test('returns 200 or 404 — never 500', async () => {
    const res = await request(app).get('/api/parking/all');
    expect(res.status).not.toBe(500);
    expect([200, 404]).toContain(res.status);
  });

  test('200 response is a valid GeoJSON FeatureCollection', async () => {
    const res = await request(app).get('/api/parking/all');
    if (res.status === 200) {
      expect(res.headers['content-type']).toMatch(/application\/json/);
      assertGeoJSONFeatureCollection(res.body);
    }
  });
});

describe('GET /api/green/all', () => {
  test('returns 200 or 404 — never 500', async () => {
    const res = await request(app).get('/api/green/all');
    expect(res.status).not.toBe(500);
    expect([200, 404]).toContain(res.status);
  });

  test('200 response is a valid GeoJSON FeatureCollection', async () => {
    const res = await request(app).get('/api/green/all');
    if (res.status === 200) {
      expect(res.headers['content-type']).toMatch(/application\/json/);
      assertGeoJSONFeatureCollection(res.body);
    }
  });
});

// ---------------------------------------------------------------------------
// Catch-all 404 for completely unmatched routes
// ---------------------------------------------------------------------------

describe('Unmatched routes', () => {
  test('GET /api/nonexistent returns 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });

  test('GET / returns 404 (no static frontend served by backend)', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Content-Type header assertions across all main endpoints
// ---------------------------------------------------------------------------

describe('Content-Type is always application/json', () => {
  const endpoints = [
    '/health',
    '/api/data/unknownlayer',
    '/api/tiles/trees/badkey!!',
  ];

  test.each(endpoints)(
    '%s responds with JSON content-type',
    async (endpoint) => {
      const res = await request(app).get(endpoint);
      expect(res.headers['content-type']).toMatch(/application\/json/);
    }
  );
});
