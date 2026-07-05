const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/chatController');

const router = express.Router();

router.use(protect);

router.get('/conversations', ctrl.listConversations);
router.post('/conversations', ctrl.createConversation);
router.get('/conversations/:id/messages', ctrl.getMessages);
router.post('/conversations/:id/messages', ctrl.sendMessage);

module.exports = router;
