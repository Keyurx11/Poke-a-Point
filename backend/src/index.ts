// backend/src/index.ts

import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';

const app = express();

// CORS configuration
app.use(cors({
  origin: '*', // Since frontend and backend are on the same origin, you can set this to '*'
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// TypeScript interfaces
interface User {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  users: User[];
  votes: { [userId: string]: number | string | null };
  showVotes: boolean;
}

// In-memory storage
const rooms: { [roomId: string]: Room } = {};

// Utility function
const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Socket.IO connection handler
io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create Room
  socket.on(
    'createRoom',
    (
      { roomName, userName }: { roomName: string; userName: string },
      callback: (response: { roomId?: string; error?: string }) => void
    ) => {
      const roomId = generateId();
      const newRoom: Room = {
        id: roomId,
        name: roomName,
        users: [{ id: socket.id, name: userName }],
        votes: {},
        showVotes: false,
      };

      rooms[roomId] = newRoom;
      socket.join(roomId);

      callback({ roomId });
    }
  );

  // Join Room
  socket.on(
    'joinRoom',
    (
      { roomId, userName }: { roomId: string; userName: string },
      callback: (response: { success: boolean; room?: Room; error?: string }) => void
    ) => {
      const room = rooms[roomId];
      if (room) {
        const userExists = room.users.some((user) => user.id === socket.id);
        if (!userExists) {
          room.users.push({ id: socket.id, name: userName });
        }
        socket.join(roomId);
        callback({ success: true, room });
        io.to(roomId).emit('roomData', room);
      } else {
        callback({ success: false, error: 'Room not found' });
      }
    }
  );

  // Rejoin Room
  socket.on(
    'rejoinRoom',
    (
      { roomId, userName }: { roomId: string; userName: string },
      callback: (response: { success: boolean; room?: Room; error?: string }) => void
    ) => {
      const room = rooms[roomId];
      if (room) {
        const userExists = room.users.some((user) => user.id === socket.id);
        if (!userExists) {
          room.users.push({ id: socket.id, name: userName });
        }
        socket.join(roomId);
        callback({ success: true, room });
        io.to(roomId).emit('roomData', room);
      } else {
        callback({ success: false, error: 'Room not found' });
      }
    }
  );

  // Vote Event
  socket.on(
    'vote',
    (
      { roomId, userId, vote }: { roomId: string; userId: string; vote: number | string | null },
      callback: (response: { success: boolean; error?: string }) => void
    ) => {
      const room = rooms[roomId];
      if (room) {
        room.votes[userId] = vote;
        io.to(roomId).emit('votesUpdate', room.votes);
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Room not found' });
      }
    }
  );

  // Reset Votes Event
  socket.on(
    'resetVotes',
    ({ roomId }: { roomId: string }, callback: (response: { success: boolean; error?: string }) => void) => {
      const room = rooms[roomId];
      if (room) {
        room.votes = {};
        room.showVotes = false;
        io.to(roomId).emit('votesUpdate', room.votes);
        io.to(roomId).emit('toggleVotes', room.showVotes);
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Room not found' });
      }
    }
  );

  // Toggle Votes Visibility Event
  socket.on(
    'toggleVotes',
    (
      { roomId, showVotes }: { roomId: string; showVotes: boolean },
      callback?: (response: { success: boolean; error?: string }) => void
    ) => {
      const room = rooms[roomId];
      if (room) {
        room.showVotes = showVotes;
        io.to(roomId).emit('toggleVotes', showVotes);
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    }
  );

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const userIndex = room.users.findIndex((user) => user.id === socket.id);
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        delete room.votes[socket.id];
        io.to(roomId).emit('roomData', room);
        io.to(roomId).emit('votesUpdate', room.votes);
        break;
      }
    }
  });
});

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'public')));

// For any other requests, serve the frontend's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});