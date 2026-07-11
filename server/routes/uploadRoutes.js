const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/uploadController');

const router = express.Router();

router.post('/image', protect, upload.single('image'), ctrl.uploadImage);
router.post('/images', protect, upload.array('images', 5), ctrl.uploadImages);

module.exports = router;
