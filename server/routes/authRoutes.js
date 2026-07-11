const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  ctrl.register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  ctrl.login
);

// Social login (Google / Facebook) — verified server-side, returns our JWT.
router.post('/google', ctrl.googleLogin);
router.post('/facebook', ctrl.facebookLogin);

router.get('/profile', protect, ctrl.getProfile);
router.put('/profile', protect, ctrl.updateProfile);
router.put(
  '/change-password',
  protect,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ]),
  ctrl.changePassword
);
router.post(
  '/forgot-password',
  validate([body('email').isEmail().withMessage('A valid email is required')]),
  ctrl.forgotPassword
);
router.post(
  '/reset-password',
  validate([
    body('email').isEmail().withMessage('A valid email is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  ctrl.resetPassword
);

module.exports = router;
