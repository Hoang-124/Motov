import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  const allowedOrigins = [
    process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  // Authentication middleware using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as any;
      socket.data = {
        userId: decoded.id,
        email: decoded.email,
        roles: decoded.roles
      };
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`Socket connected: ${socket.id} for user ${userId}`);

    // Join personal user room
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined personal room user_${userId}`);

    // Join a specific conversation room
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave a specific conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
