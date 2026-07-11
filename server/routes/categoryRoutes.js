const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/categoryController');

const router = express.Router();

router.get('/', ctrl.listCategories);
router.post(
  '/',
  protect,
  authorize('admin'),
  validate([body('name').trim().notEmpty().withMessage('Category name is required')]),
  ctrl.createCategory
);
router.put('/:id', protect, authorize('admin'), ctrl.updateCategory);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteCategory);

module.exports = router;
