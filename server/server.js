require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const shopRoutes = require('./routes/shopRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// ─── Security & infra middleware (exact order per docs §9.1) ───
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

// ─── Standard body parsers (gateway returns arrive as form-urlencoded) ───
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Payment gateway return/redirect endpoints ───
app.use('/api/payment', paymentRoutes);

// ─── Static uploads ───
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// ─── Ensure DB is connected before handling any request (serverless-safe) ───
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ─── Health check (docs §15) ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── API routes ───
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/seller', sellerRoutes);

// ─── 404 + global error handler (must be last) ───
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;



// Only start listening when run directly (tests import the app without listening).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✔ API server running on http://localhost:${PORT}  (${process.env.NODE_ENV || 'development'})`);
  });
}

module.exports = app;
