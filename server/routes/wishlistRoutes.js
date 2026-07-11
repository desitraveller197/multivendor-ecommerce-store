const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/wishlistController');

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getWishlist);
router.put('/', ctrl.syncWishlist);

module.exports = router;
