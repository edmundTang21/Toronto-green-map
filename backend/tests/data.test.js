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
  it('returns 200 or 404 (never 500) for parking layer', async () => {
    const res = await request(app).get('/api/data/parking');
    // In CI the data directory is not present, so 404 is acceptable.
    // A 500 is never acceptable.
    expect(res.status).not.toBe(500);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.type).toBe('FeatureCollection');
      expect(Array.isArray(res.body.features)).toBe(true);
    }
  });

  it('returns 200 or 404 (never 500) for boundary layer', async () => {
    const res = await request(app).get('/api/data/boundary');
    expect(res.status).not.toBe(500);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.type).toBe('FeatureCollection');
      expect(Array.isArray(res.body.features)).toBe(true);
    }
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

  it('sets Cache-Control header when layer returns 200', async () => {
    const res = await request(app).get('/api/data/parking');
    if (res.status === 200) {
      expect(res.headers['cache-control']).toMatch(/max-age=3600/);
    }
  });

  it('serves from cache on second request (no error)', async () => {
    // First request — may populate cache if data file is present
    await request(app).get('/api/data/boundary');
    // Second request should not error regardless of whether data exists
    const res = await request(app).get('/api/data/boundary');
    expect(res.status).not.toBe(500);
    expect([200, 404]).toContain(res.status);
  });
});

describe('GET /api/parking/all', () => {
  it('returns 200 or 404 (never 500)', async () => {
    const res = await request(app).get('/api/parking/all');
    expect(res.status).not.toBe(500);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.type).toBe('FeatureCollection');
      expect(Array.isArray(res.body.features)).toBe(true);
    }
  });
});

describe('GET /api/green/all', () => {
  it('returns 200 or 404 (never 500)', async () => {
    const res = await request(app).get('/api/green/all');
    expect(res.status).not.toBe(500);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.type).toBe('FeatureCollection');
      expect(Array.isArray(res.body.features)).toBe(true);
    }
  });
});

describe('Unmatched routes', () => {
  it('returns 404 for completely unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
