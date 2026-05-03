import * as Utils from '../lib/utils';
// import { Server, Socket } from 'socket.io';
// import ChatService from '../services/chat/chat.service';
// import { verifySocketToken } from '../middleware/socketaAuth.middleware';

// export const chatNamespace = (io: Server) => {
//   const chat = io.of('/chat');

//   // Apply middleware for authentication
//   chat.use((socket: Socket, next) => verifySocketToken(socket, next, ['customer', 'professional']));

//   chat.on('connection', (socket: Socket) => {
//     const userId = socket.data.user.id;
//     console.log(`User connected to chat namespace: ${userId}`);

//     // Join room for user
//     socket.join(`user_${userId}`);
//     chat.to(`user_${userId}`).emit('user_online', { userId });

//     // Send message
//     socket.on('send_message', async (payload) => {
//       const message = await ChatService.sendMessage(
//         payload.conversationId,
//         userId,
//         payload.receiverId,
//         payload.text,
//       );
//       chat.to(`user_${payload.receiverId}`).emit('new_message', message);
//       chat.to(`user_${userId}`).emit('message_delivered', { messageId: message.messageData.id });
//     });

//     // Message seen
//     socket.on('message_seen', async (payload) => {
//       await ChatService.markMessageSeen(payload.messageId);
//       chat
//         .to(`user_${payload.senderId}`)
//         .emit('message_seen_update', { messageId: payload.messageId });
//     });

//     // Typing events
//     socket.on('typing', (payload) => {
//       socket.to(`user_${payload.receiverId}`).emit('typing', payload);
//     });

//     socket.on('stop_typing', (payload) => {
//       socket.to(`user_${payload.receiverId}`).emit('stop_typing', payload);
//     });

//     // Disconnect
//     socket.on('disconnect', () => {
//       chat.to(`user_${userId}`).emit('user_offline', { userId });
//       console.log(`User disconnected: ${userId}`);
//     });
//   });
// };

// let io: Server | null = null;

// export const initSocket = (server: any): Server => {
//   io = new Server(server, {
//     cors: {
//       origin: '*',
//       methods: ['GET', 'POST'],
//     },
//   });

//   return io;
// };

// export const getIO = (): Server => {
//   if (!io) {
//     throw new Utils.AppError('Socket.io not initialized', Utils.statusCode.BAD_REQUEST);
//   }
//   return io;
// };
