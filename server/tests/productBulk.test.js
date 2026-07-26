const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const connectTestDB = require('./setup');
const User = require('../models/User');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

let dbReady = false;
let approvedSellerToken = '';
let unapprovedSellerToken = '';

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_at_least_32_chars_long_string';
  dbReady = await connectTestDB();
  if (dbReady) {
    // Clear test data
    await User.deleteMany({ email: /jestbulk/ });
    await Product.deleteMany({});
    await Shop.deleteMany({});

    // Register and approve seller
    const sellerCreds = {
      name: 'Jest Approved Seller',
      email: 'jestbulk_approved@example.com',
      password: 'sellerpassword123',
      role: 'seller'
    };
    await request(app).post('/api/auth/register').send(sellerCreds);
    
    // Manually approve seller in DB
    const sellerUser = await User.findOne({ email: sellerCreds.email });
    sellerUser.isApproved = true;
    await sellerUser.save();

    // Login approved seller
    const loginApproved = await request(app).post('/api/auth/login').send({
      email: sellerCreds.email,
      password: sellerCreds.password,
      role: 'seller'
    });
    approvedSellerToken = loginApproved.body.token;

    // Register unapproved seller
    const unapprovedCreds = {
      name: 'Jest Unapproved Seller',
      email: 'jestbulk_unapproved@example.com',
      password: 'sellerpassword123',
      role: 'seller'
    };
    await request(app).post('/api/auth/register').send(unapprovedCreds);

    // Login unapproved seller (remains isApproved: false by default)
    const loginUnapproved = await request(app).post('/api/auth/login').send({
      email: unapprovedCreds.email,
      password: unapprovedCreds.password,
      role: 'seller'
    });
    unapprovedSellerToken = loginUnapproved.body.token;
  }
});

afterAll(async () => {
  if (dbReady) {
    await User.deleteMany({ email: /jestbulk/ });
    await Product.deleteMany({});
    await Shop.deleteMany({});
    await mongoose.connection.close();
  }
});

const maybe = () => (dbReady ? it : it.skip);

describe('Product Bulk Upload API', () => {
  maybe()('POST /api/products/bulk rejects request without token', async () => {
    const csvContent = 'name,price,description,stock\nProduct A,100,Desc A,10';
    const buffer = Buffer.from(csvContent, 'utf-8');

    const res = await request(app)
      .post('/api/products/bulk')
      .attach('file', buffer, 'products.csv');

    expect(res.status).toBe(401);
  });

  maybe()('POST /api/products/bulk rejects request for unapproved seller', async () => {
    const csvContent = 'name,price,description,stock\nProduct A,100,Desc A,10';
    const buffer = Buffer.from(csvContent, 'utf-8');

    const res = await request(app)
      .post('/api/products/bulk')
      .set('Authorization', `Bearer ${unapprovedSellerToken}`)
      .attach('file', buffer, 'products.csv');

    expect(res.status).toBe(403);
  });

  maybe()('POST /api/products/bulk uploads products successfully', async () => {
    const csvContent = 'name,price,description,stock,category,region,colorFamilies,seasons,sizes\nProduct 1,1200,Description 1,15,Clothing,Punjab,"Red,Blue","Summer,Spring","S,M"\nProduct 2,1500,Description 2,25,Clothing,Sindh,"Black","Winter","L"';
    const buffer = Buffer.from(csvContent, 'utf-8');

    const res = await request(app)
      .post('/api/products/bulk')
      .set('Authorization', `Bearer ${approvedSellerToken}`)
      .attach('file', buffer, 'products.csv');

    expect(res.status).toBe(201);
    expect(res.body.successCount).toBe(2);
    expect(res.body.failedCount).toBe(0);
    expect(res.body.errors.length).toBe(0);

    // Verify products were inserted into MongoDB
    const inserted = await Product.find({ name: { $in: ['Product 1', 'Product 2'] } });
    expect(inserted.length).toBe(2);

    const p1 = inserted.find(p => p.name === 'Product 1');
    expect(p1.price).toBe(1200);
    expect(p1.stock).toBe(15);
    expect(p1.category).toBe('Clothing');
    expect(p1.region).toBe('Punjab');
    expect(p1.colorFamilies).toEqual(expect.arrayContaining(['Red', 'Blue']));
    expect(p1.seasons).toEqual(expect.arrayContaining(['Summer', 'Spring']));
    expect(p1.variants[0].size).toBe('S');
  });

  maybe()('POST /api/products/bulk handles errors for invalid rows and does not block valid ones', async () => {
    // Row 2 is valid, Row 3 is missing name, Row 4 is valid
    const csvContent = 'name,price,description,stock\nValid Product X,800,Desc X,5\n,950,Missing Name,10\nValid Product Y,600,Desc Y,12';
    const buffer = Buffer.from(csvContent, 'utf-8');

    const res = await request(app)
      .post('/api/products/bulk')
      .set('Authorization', `Bearer ${approvedSellerToken}`)
      .attach('file', buffer, 'products.csv');

    expect(res.status).toBe(201);
    expect(res.body.successCount).toBe(2);
    expect(res.body.failedCount).toBe(1);
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0]).toEqual({
      row: 3,
      message: 'Product name is required'
    });

    const products = await Product.find({ name: { $in: ['Valid Product X', 'Valid Product Y'] } });
    expect(products.length).toBe(2);
  });

  maybe()('GET /api/products/bulk/template returns a downloadable .xlsx file', async () => {
    const res = await request(app)
      .get('/api/products/bulk/template')
      .set('Authorization', `Bearer ${approvedSellerToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.header['content-disposition']).toContain('attachment; filename=bazarix_bulk_upload_template.xlsx');
    expect(res.body).toBeInstanceOf(Buffer);
  });
});
