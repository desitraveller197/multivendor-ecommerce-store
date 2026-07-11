const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

/**
 * @desc    Get current user's notifications, newest first
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 });
  res.json(notifications);
});

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  notification.isRead = true;
  await notification.save();
  res.json(notification);
});

/**
 * @desc    Mark all notifications for the user as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true, read: true } }
  );
  res.json({ message: 'All notifications marked as read' });
});

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
