const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const connectTestDB = require('./setup');

let dbReady = false;
beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_at_least_32_chars_long_string';
  dbReady = await connectTestDB();
});
afterAll(async () => {
  if (dbReady) await mongoose.connection.close();
});
const maybe = () => (dbReady ? it : it.skip);

describe('Product API', () => {
  maybe()('GET /api/products returns an array', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  maybe()('POST /api/products is rejected without a token', async () => {
    const res = await request(app).post('/api/products').send({ name: 'X', price: 10 });
    expect(res.status).toBe(401);
  });
});
