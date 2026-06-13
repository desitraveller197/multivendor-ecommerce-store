const request = require('supertest');
const app = require('../server');

describe('Health endpoint', () => {
  it('GET /api/health returns ok (no DB required)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('time');
  });

  it('unknown route returns 404 with a message', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});
