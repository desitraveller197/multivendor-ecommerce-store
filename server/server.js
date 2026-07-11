require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const shopRoutes = require('./routes/shopRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const posterRoutes = require('./routes/posterRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { initSocket } = require('./socket');

const app = express();

// ─── Security & infra middleware (exact order per docs §9.1) ───
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);
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
app.use(mongoSanitize());

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
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/posters', posterRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── 404 + global error handler (must be last) ───
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

if (require.main === module) {
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`✔ API server running on http://localhost:${PORT}  (${process.env.NODE_ENV || 'development'})`);
    console.log('✔ Real-time chat enabled (Socket.io)');
    
    // Recompute all discounts on startup to sync event/name labels in database
    connectDB().then(() => {
      const User = require('./models/User');
      const { recomputeShopDiscounts } = require('./controllers/discountController');
      return User.find({ role: 'seller' }).select('_id').then((sellers) => {
        sellers.forEach((seller) => {
          recomputeShopDiscounts(seller._id).catch(() => {});
        });
        console.log('✔ Discount events backfilled successfully.');
      });
    }).catch((err) => {
      console.error('Failed to backfill discounts:', err.message);
    });
  });
}

module.exports = app;
