const asyncHandler = require('../utils/asyncHandler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

function buildParticipantKey(userIds) {
  return [...userIds].map(String).sort().join(':');
}

function formatConversation(doc, currentUserId) {
  const conv = doc.toJSON ? doc.toJSON() : { ...doc };
  const other = (conv.participants || []).find(
    (p) => String(p.user?.id || p.user?._id || p.user) !== String(currentUserId)
  );
  conv.otherParticipant = other
    ? {
        id: other.user?.id || other.user?._id || other.user,
        name: other.name || 'User',
        role: other.role,
      }
    : null;
  return conv;
}

async function assertCanAccessConversation(conversation, user) {
  const isParticipant = conversation.participants.some(
    (p) => String(p.user) === String(user._id)
  );
  if (!isParticipant && user.role !== 'admin') {
    const err = new Error('Not authorized for this conversation');
    err.statusCode = 403;
    throw err;
  }
}

function validateConversationType(type, user, recipient) {
  if (type === 'buyer_seller') {
    const roles = new Set([user.role, recipient.role]);
    return roles.has('customer') && roles.has('seller');
  }
  if (type === 'admin_vendor') {
    const roles = new Set([user.role, recipient.role]);
    return roles.has('admin') && roles.has('seller');
  }
  if (type === 'order') return true;
  return false;
}

// GET /api/chat/conversations
const listConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    'participants.user': req.user._id,
  })
    .sort({ lastMessageAt: -1 })
    .populate('order', 'orderStatus totalPrice')
    .populate('product', 'name image')
    .lean({ virtuals: true });

  res.json(
    conversations.map((c) => {
      const conv = { ...c, id: c._id };
      delete conv._id;
      const other = (conv.participants || []).find(
        (p) => String(p.user) !== String(req.user._id)
      );
      conv.otherParticipant = other
        ? {
            id: other.user,
            name: other.name || 'User',
            role: other.role,
          }
        : null;
      return conv;
    })
  );
});

// POST /api/chat/conversations
const createConversation = asyncHandler(async (req, res) => {
  const { type, recipientId, orderId, productId, subject } = req.body;
  if (!type || !recipientId) {
    res.status(400);
    throw new Error('type and recipientId are required');
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    res.status(404);
    throw new Error('Recipient not found');
  }

  if (!validateConversationType(type, req.user, recipient)) {
    res.status(400);
    throw new Error('Invalid conversation type for these participants');
  }

  let order = null;
  if (orderId) {
    order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    const isCustomer = String(order.customer) === String(req.user._id);
    const isSeller = order.orderItems.some(
      (item) => String(item.seller) === String(req.user._id)
    );
    const isAdmin = req.user.role === 'admin';
    if (!isCustomer && !isSeller && !isAdmin) {
      res.status(403);
      throw new Error('Not authorized for this order');
    }
  }

  let product = null;
  if (productId) {
    product = await Product.findById(productId);
  }

  const participantIds = [req.user._id, recipient._id];
  const participantKey = buildParticipantKey(participantIds);

  let conversation = await Conversation.findOne({
    participantKey,
    type: orderId ? 'order' : type,
    order: orderId || null,
  });

  if (!conversation) {
    const convType = orderId ? 'order' : type;
    conversation = await Conversation.create({
      type: convType,
      participantKey,
      order: orderId || null,
      product: productId || null,
      subject:
        subject ||
        (orderId
          ? `Order #${String(orderId).slice(-6)}`
          : product
            ? `About ${product.name}`
            : `Chat with ${recipient.name}`),
      participants: [
        { user: req.user._id, role: req.user.role, name: req.user.name },
        { user: recipient._id, role: recipient.role, name: recipient.name },
      ],
    });
  }

  res.status(201).json(formatConversation(conversation, req.user._id));
});

// GET /api/chat/conversations/:id/messages
const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  await assertCanAccessConversation(conversation, req.user);

  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: 1 })
    .populate('sender', 'name role avatar')
    .lean({ virtuals: true });

  res.json(
    messages.map((m) => {
      const msg = { ...m, id: m._id };
      delete msg._id;
      return msg;
    })
  );
});

// POST /api/chat/conversations/:id/messages
const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Message text is required');
  }

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  await assertCanAccessConversation(conversation, req.user);

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: text.trim(),
    readBy: [req.user._id],
  });

  conversation.lastMessage = text.trim();
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const populated = await Message.findById(message._id)
    .populate('sender', 'name role avatar')
    .lean({ virtuals: true });

  const payload = { ...populated, id: populated._id };
  delete payload._id;

  res.status(201).json({
    message: payload,
    conversationId: conversation._id,
  });
});

module.exports = {
  listConversations,
  createConversation,
  getMessages,
  sendMessage,
  buildParticipantKey,
  formatConversation,
  assertCanAccessConversation,
};
