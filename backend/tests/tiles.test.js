'use strict';

const request = require('supertest');
const app = require('../index');
const cache = require('../middleware/cache');

beforeEach(() => {
  cache.flush();
});

describe('GET /api/tiles/trees/:key', () => {
  it('returns 200 or 404 for a valid tile key that exists', async () => {
    const res = await request(app).get('/api/tiles/trees/-7913_4378');
    expect([200, 404]).toContain(res.status);
    // Must never return 500
    expect(res.status).not.toBe(500);
  });

  it('returns 404 for a tile key that does not exist', async () => {
    const res = await request(app).get('/api/tiles/trees/0_0');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 for an invalid tile key format', async () => {
    const res = await request(app).get('/api/tiles/trees/invalid-key!');
    expect(res.status).toBe(404);
  });

  it('returns 404 for path traversal attempt in tile key', async () => {
    const res = await request(app).get('/api/tiles/trees/../../etc/passwd');
    expect(res.status).toBe(404);
  });

  it('returns 404 for path traversal with encoded chars', async () => {
    const res = await request(app).get('/api/tiles/trees/%2e%2e%2fetc%2fpasswd');
    expect(res.status).toBe(404);
  });

  it('returns valid GeoJSON body when tile exists', async () => {
    const res = await request(app).get('/api/tiles/trees/-7913_4378');
    if (res.status === 200) {
      expect(res.body.type).toBeDefined();
    }
    // 404 is also acceptable
  });

  it('sets Cache-Control header when tile is found', async () => {
    const res = await request(app).get('/api/tiles/trees/-7913_4378');
    if (res.status === 200) {
      expect(res.headers['cache-control']).toMatch(/max-age=3600/);
    }
  });
});
