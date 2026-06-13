const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireApprovedSeller } = require('../middleware/roleMiddleware');
const User = require('../models/User');
const ctrl = require('../controllers/productController');

const router = express.Router();

/**
 * optionalAuth — if a valid Bearer token is present, attach req.user.
 * Lets GET /products return seller-scoped results for an authed seller
 * while remaining public for everyone else.
 */
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      /* ignore — treat as anonymous */
    }
  }
  next();
}

router.get('/', optionalAuth, ctrl.listProducts);
router.get('/:id', ctrl.getProduct);
router.post(
  '/',
  protect,
  authorize('seller', 'admin'),
  requireApprovedSeller,
  validate([
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ]),
  ctrl.createProduct
);
router.put('/:id', protect, authorize('seller', 'admin'), ctrl.updateProduct);
router.delete('/:id', protect, authorize('seller', 'admin'), ctrl.deleteProduct);

module.exports = router;
