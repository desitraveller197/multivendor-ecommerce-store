const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { assertCanAccessConversation } = require('../controllers/chatController');

let io = null;

// Tracks which users currently have at least one live socket connection.
// Map<userId, { role, sockets: Set<socketId> }>
const onlineUsers = new Map();

function snapshotOnline() {
  return [...onlineUsers.entries()].map(([userId, info]) => ({
    userId,
    role: info.role,
  }));
}

function markOnline(ioInstance, socket) {
  const userId = String(socket.user._id);
  const existing = onlineUsers.get(userId);
  if (existing) {
    existing.sockets.add(socket.id);
    return;
  }
  onlineUsers.set(userId, { role: socket.user.role, sockets: new Set([socket.id]) });
  // First connection for this user → announce they came online.
  ioInstance.emit('presence_change', { userId, role: socket.user.role, online: true });
}

function markOffline(ioInstance, socket) {
  const userId = String(socket.user._id);
  const info = onlineUsers.get(userId);
  if (!info) return;
  info.sockets.delete(socket.id);
  if (info.sockets.size === 0) {
    onlineUsers.delete(userId);
    // Last connection closed → announce they went offline.
    ioInstance.emit('presence_change', { userId, role: info.role, online: false });
  }
}

function initSocket(server) {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
    },
  });

  if (process.env.REDIS_URL) {
    try {
      const { createClient } = require('redis');
      const { createAdapter } = require('@socket.io/redis-adapter');
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('✔ Socket.io Redis adapter configured');
      }).catch((err) => {
        console.error('Socket.io Redis adapter connection failed:', err.message);
      });
    } catch (err) {
      console.error('Socket.io Redis adapter initialization failed:', err.message);
    }
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      socket.join(`user:${user._id}`);
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // ─── Presence: mark this user online and send them the current roster ───
    markOnline(io, socket);
    socket.emit('presence_state', { online: snapshotOnline() });

    socket.on('get_online_users', (callback) => {
      if (typeof callback === 'function') callback({ online: snapshotOnline() });
    });

    socket.on('disconnect', () => {
      markOffline(io, socket);
    });

    socket.on('join_conversation', async ({ conversationId }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (typeof callback === 'function') callback({ ok: false, error: 'Conversation not found' });
          return;
        }
        await assertCanAccessConversation(conversation, socket.user);
        socket.join(`conversation:${conversationId}`);
        if (typeof callback === 'function') callback({ ok: true });
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ ok: false, error: err.message || 'Not authorized' });
        }
      }
    });

    socket.on('send_message', async ({ conversationId, text }, callback) => {
      try {
        if (!conversationId || !text?.trim()) {
          if (typeof callback === 'function') callback({ error: 'Message text is required' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (typeof callback === 'function') callback({ error: 'Conversation not found' });
          return;
        }
        await assertCanAccessConversation(conversation, socket.user);

        const message = await Message.create({
          conversation: conversation._id,
          sender: socket.user._id,
          text: text.trim(),
          readBy: [socket.user._id],
        });

        conversation.lastMessage = text.trim();
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const populated = await Message.findById(message._id)
          .populate('sender', 'name role avatar')
          .lean({ virtuals: true });

        const payload = {
          ...populated,
          id: populated._id,
          conversationId,
        };
        delete payload._id;

        io.to(`conversation:${conversationId}`).emit('new_message', payload);

        for (const participant of conversation.participants) {
          io.to(`user:${participant.user}`).emit('conversation_updated', {
            conversationId,
            lastMessage: text.trim(),
            lastMessageAt: conversation.lastMessageAt,
          });
        }

        if (typeof callback === 'function') {
          callback({ message: payload });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ error: err.message || 'Failed to send message' });
        } else {
          socket.emit('chat_error', { message: err.message || 'Failed to send message' });
        }
      }
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('stop_typing', {
        conversationId,
        userId: socket.user._id,
      });
    });
  });

  return io;
}

function sendNotification(userId, data) {
  if (io) {
    io.to(`user:${userId}`).emit('new_notification', data);
  }
}

module.exports = { initSocket, sendNotification };
