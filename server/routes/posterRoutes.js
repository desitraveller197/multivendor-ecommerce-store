const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/posterController');

const router = express.Router();

// Public: active posters for the home page hero
router.get('/', ctrl.listPosters);

// Admin only
router.post('/', protect, authorize('admin'), ctrl.createPoster);
router.patch('/:id', protect, authorize('admin'), ctrl.updatePoster);
router.delete('/:id', protect, authorize('admin'), ctrl.deletePoster);

module.exports = router;
