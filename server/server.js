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
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);
      // In development, allow any localhost port
      if (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // In production, restrict to CLIENT_URL
      const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
      if (origin === allowed) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: false,
  })
);

// ─── Stripe webhook needs the RAW body and must precede express.json() ───
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payment', paymentRoutes);

// ─── Standard JSON parser ───
app.use(express.json({ limit: '1mb' }));

// ─── Static uploads ───
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

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

// Connect to database
connectDB();

// Only start listening when run directly (tests import the app without listening).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✔ API server running on http://localhost:${PORT}  (${process.env.NODE_ENV || 'development'})`);
  });
}

module.exports = app;
