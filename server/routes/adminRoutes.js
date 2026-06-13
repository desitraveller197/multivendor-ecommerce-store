const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.listUsers);
router.delete('/users/:id', ctrl.deleteUser);
router.put('/sellers/:id/approve', ctrl.approveSeller);
router.put('/sellers/:id/reject', ctrl.rejectSeller);
router.get('/orders', ctrl.listOrders);

module.exports = router;
