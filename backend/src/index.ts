import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { User, Room } from './type';

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
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

// In-memory storage
const rooms: { [roomId: string]: Room } = {};

// Utility functions
const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Sanitize votes to prevent prematurely exposing vote values before reveal
const getPublicVotes = (room: Room) => {
  if (room.showVotes) {
    return room.votes;
  }
  const maskedVotes: { [userId: string]: boolean | null } = {};
  for (const userId in room.votes) {
    maskedVotes[userId] = room.votes[userId] !== null && room.votes[userId] !== undefined;
  }
  return maskedVotes;
};

const getPublicRoom = (room: Room): Room => {
  return {
    ...room,
    votes: getPublicVotes(room) as { [userId: string]: number | string | null },
  };
};

// Helper to find user by socket
const getUserBySocketId = (room: Room, socketId: string): User | undefined => {
  return room.users.find((u) => u.socketId === socketId);
};

const DEFAULT_VOTING_OPTIONS = [1, 2, 3, 5, 8, 13, 21, '?'];

// Socket.IO connection handler
io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create Room
  socket.on(
    'createRoom',
    (
      { roomName, userName, userId, votingOptions }: { roomName: string; userName: string; userId?: string; votingOptions?: (number | string)[] },
      callback: (response: { roomId?: string; userId?: string; error?: string }) => void
    ) => {
      const roomId = generateId();
      const actualUserId = userId || generateId();
      const newRoom: Room = {
        id: roomId,
        name: roomName,
        creatorId: actualUserId,
        users: [{ id: actualUserId, name: userName, socketId: socket.id }],
        votes: {},
        showVotes: false,
        votingOptions: (votingOptions && votingOptions.length > 0) ? votingOptions : DEFAULT_VOTING_OPTIONS,
      };

      rooms[roomId] = newRoom;
      socket.join(roomId);

      callback({ roomId, userId: actualUserId });
    }
  );

  // Join / Rejoin Room
  const handleJoin = (
    { roomId, userName, userId }: { roomId: string; userName: string; userId: string },
    callback: (response: { success: boolean; room?: Room; error?: string }) => void
  ) => {
    const room = rooms[roomId];
    if (room) {
      const existingUser = room.users.find((u) => u.id === userId);
      if (existingUser) {
        existingUser.socketId = socket.id;
        existingUser.name = userName;
      } else {
        room.users.push({ id: userId, name: userName, socketId: socket.id });
      }
      socket.join(roomId);
      callback({ success: true, room: getPublicRoom(room) });
      io.to(roomId).emit('roomData', getPublicRoom(room));
    } else {
      callback({ success: false, error: 'Room not found' });
    }
  };

  socket.on('joinRoom', handleJoin);
  socket.on('rejoinRoom', handleJoin);

  // Vote Event
  socket.on(
    'vote',
    (
      { roomId, userId, vote }: { roomId: string; userId: string; vote: number | string | null },
      callback: (response: { success: boolean; error?: string }) => void
    ) => {
      const room = rooms[roomId];
      if (room) {
        if (vote === null) {
          delete room.votes[userId];
        } else {
          room.votes[userId] = vote;
        }
        io.to(roomId).emit('votesUpdate', getPublicVotes(room));
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Room not found' });
      }
    }
  );

  // Reset Votes Event (Host Authorized)
  socket.on(
    'resetVotes',
    ({ roomId }: { roomId: string }, callback: (response: { success: boolean; error?: string }) => void) => {
      const room = rooms[roomId];
      if (room) {
        const user = getUserBySocketId(room, socket.id);
        if (user && user.id !== room.creatorId) {
          return callback({ success: false, error: 'Unauthorized: Only session host can reset votes' });
        }

        room.votes = {};
        room.showVotes = false;
        io.to(roomId).emit('votesUpdate', getPublicVotes(room));
        io.to(roomId).emit('toggleVotes', room.showVotes);
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Room not found' });
      }
    }
  );

  // Toggle Votes Visibility Event (Host Authorized)
  socket.on(
    'toggleVotes',
    (
      { roomId, showVotes }: { roomId: string; showVotes: boolean },
      callback?: (response: { success: boolean; error?: string }) => void
    ) => {
      const room = rooms[roomId];
      if (room) {
        const user = getUserBySocketId(room, socket.id);
        if (user && user.id !== room.creatorId) {
          if (callback) callback({ success: false, error: 'Unauthorized: Only session host can reveal/hide votes' });
          return;
        }

        room.showVotes = showVotes;
        io.to(roomId).emit('toggleVotes', showVotes);
        io.to(roomId).emit('votesUpdate', getPublicVotes(room));
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    }
  );

  // Handle Disconnect with Grace Period for page refreshes
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const user = room.users.find((u) => u.socketId === socket.id);
      if (user) {
        user.socketId = '';
        
        // Wait 3 seconds before cleaning up user to allow smooth page refresh / reconnection
        setTimeout(() => {
          // If user hasn't reconnected with a new socketId within 3 seconds
          if (rooms[roomId] && user.socketId === '') {
            const index = room.users.findIndex((u) => u.id === user.id);
            if (index !== -1) {
              room.users.splice(index, 1);
              delete room.votes[user.id];

              if (room.users.length === 0) {
                delete rooms[roomId];
              } else {
                if (room.creatorId === user.id && room.users.length > 0) {
                  room.creatorId = room.users[0].id;
                }
                io.to(roomId).emit('roomData', getPublicRoom(room));
                io.to(roomId).emit('votesUpdate', getPublicVotes(room));
              }
            }
          }
        }, 3000);
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