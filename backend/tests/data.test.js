'use strict';

const request = require('supertest');
const app = require('../index');
const cache = require('../middleware/cache');

beforeEach(() => {
  cache.flush();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('GET /api/data/:layer', () => {
  it('returns 200 with valid GeoJSON for parking layer', async () => {
    const res = await request(app).get('/api/data/parking');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(Array.isArray(res.body.features)).toBe(true);
  });

  it('returns 200 with valid GeoJSON for boundary layer', async () => {
    const res = await request(app).get('/api/data/boundary');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(Array.isArray(res.body.features)).toBe(true);
  });

  it('returns 404 for unknown layer', async () => {
    const res = await request(app).get('/api/data/unknownlayer');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/unknown layer/i);
  });

  it('returns 404 for path traversal attempt', async () => {
    const res = await request(app).get('/api/data/../../../etc/passwd');
    expect(res.status).toBe(404);
  });

  it('sets Cache-Control header on successful responses', async () => {
    const res = await request(app).get('/api/data/parking');
    expect(res.headers['cache-control']).toMatch(/max-age=3600/);
  });

  it('serves from cache on second request (no error)', async () => {
    // First request populates cache
    await request(app).get('/api/data/boundary');
    expect(cache.size()).toBeGreaterThan(0);
    // Second request should also succeed
    const res = await request(app).get('/api/data/boundary');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/parking/all', () => {
  it('returns 200 with valid GeoJSON', async () => {
    const res = await request(app).get('/api/parking/all');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(Array.isArray(res.body.features)).toBe(true);
  });
});

describe('GET /api/green/all', () => {
  it('returns 200 with valid GeoJSON', async () => {
    const res = await request(app).get('/api/green/all');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(Array.isArray(res.body.features)).toBe(true);
  });
});

describe('Unmatched routes', () => {
  it('returns 404 for completely unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
