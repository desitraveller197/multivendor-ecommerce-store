const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getNotifications);
router.patch('/:id/read', ctrl.markNotificationRead);
router.patch('/read-all', ctrl.markAllNotificationsRead);

module.exports = router;
