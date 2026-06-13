const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const connectTestDB = require('./setup');
const User = require('../models/User');

let dbReady = false;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_at_least_32_chars_long_string';
  dbReady = await connectTestDB();
  if (dbReady) await User.deleteMany({ email: /jesttest/ });
});

afterAll(async () => {
  if (dbReady) {
    await User.deleteMany({ email: /jesttest/ });
    await mongoose.connection.close();
  }
});

const maybe = () => (dbReady ? it : it.skip);

describe('Auth API', () => {
  maybe()('rejects registration with a missing email', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'X', password: 'secret1' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  maybe()('registers then logs in a customer and returns { token, role, user }', async () => {
    const creds = { name: 'Jest Tester', email: 'jesttest1@example.com', password: 'secret1', role: 'customer' };
    const reg = await request(app).post('/api/auth/register').send(creds);
    expect(reg.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password, role: 'customer' });
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('token');
    expect(login.body).toHaveProperty('role', 'customer');
    expect(login.body.user).toHaveProperty('email', creds.email);
  });

  maybe()('rejects login with a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'jesttest1@example.com', password: 'wrong', role: 'customer' });
    expect(res.status).toBe(401);
  });
});
