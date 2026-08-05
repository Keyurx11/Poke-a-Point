import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

// Utility functions - cryptographically secure random ID generator
const generateId = (): string => crypto.randomBytes(5).toString('hex');

// Sanitize votes to prevent prematurely exposing vote values before reveal.
// The viewer can always see their own vote; only other users' votes are masked.
const getPublicVotes = (room: Room, viewerUserId?: string): { [userId: string]: boolean | number | string | null } => {
  if (room.showVotes) {
    return room.votes;
  }
  const maskedVotes: { [userId: string]: boolean | number | string | null } = {};
  for (const userId in room.votes) {
    maskedVotes[userId] =
      userId === viewerUserId
        ? room.votes[userId]
        : room.votes[userId] !== null && room.votes[userId] !== undefined;
  }
  return maskedVotes;
};

const getPublicRoom = (room: Room, viewerUserId?: string): Room => {
  return {
    ...room,
    votes: getPublicVotes(room, viewerUserId),
  };
};

// Helper to find user by socket
const getUserBySocketId = (room: Room, socketId: string): User | undefined => {
  return room.users.find((u) => u.socketId === socketId);
};

// Emit personalized roomData/votesUpdate to each connected member of the room so every
// viewer sees their own vote unmasked while everyone else's stays hidden until reveal.
const broadcastRoomData = (room: Room) => {
  room.users.forEach((user) => {
    if (user.socketId) {
      io.to(user.socketId).emit('roomData', getPublicRoom(room, user.id));
    }
  });
};

const broadcastVotesUpdate = (room: Room) => {
  room.users.forEach((user) => {
    if (user.socketId) {
      io.to(user.socketId).emit('votesUpdate', getPublicVotes(room, user.id));
    }
  });
};

const DEFAULT_VOTING_OPTIONS = [1, 2, 3, 5, 8, 13, 21, '?'];

// Socket.IO connection handler
io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create Room
  socket.on(
    'createRoom',
    (
      {
        roomName,
        userName,
        userId,
        votingOptions,
        autoReveal,
      }: {
        roomName: string;
        userName: string;
        userId?: string;
        votingOptions?: (number | string)[];
        autoReveal?: boolean;
      },
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
        autoReveal: autoReveal || false,
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
      callback({ success: true, room: getPublicRoom(room, userId) });
      broadcastRoomData(room);
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
        const user = getUserBySocketId(room, socket.id);
        if (!user || user.id !== userId) {
          return callback({ success: false, error: 'Unauthorized: Cannot vote on behalf of another user or without joining room' });
        }

        if (vote === null) {
          delete room.votes[userId];
        } else {
          room.votes[userId] = vote;
        }

        // Auto-reveal check
        if (room.autoReveal && !room.showVotes) {
          const allVoted =
            room.users.length > 0 &&
            room.users.every(
              (u) => room.votes[u.id] !== null && room.votes[u.id] !== undefined
            );
          if (allVoted) {
            room.showVotes = true;
            io.to(roomId).emit('toggleVotes', true);
            broadcastRoomData(room);
          }
        }

        broadcastVotesUpdate(room);
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
        if (!user || user.id !== room.creatorId) {
          return callback({ success: false, error: 'Unauthorized: Only session host can reset votes' });
        }

        room.votes = {};
        room.showVotes = false;
        broadcastVotesUpdate(room);
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
        if (!user || user.id !== room.creatorId) {
          if (callback) callback({ success: false, error: 'Unauthorized: Only session host can reveal/hide votes' });
          return;
        }

        room.showVotes = showVotes;
        io.to(roomId).emit('toggleVotes', showVotes);
        broadcastVotesUpdate(room);
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    }
  );

  // Toggle Auto Reveal Setting Event (Host Authorized)
  socket.on(
    'toggleAutoReveal',
    (
      { roomId, autoReveal }: { roomId: string; autoReveal: boolean },
      callback?: (response: { success: boolean; error?: string }) => void
    ) => {
      const room = rooms[roomId];
      if (room) {
        const user = getUserBySocketId(room, socket.id);
        if (!user || user.id !== room.creatorId) {
          if (callback) callback({ success: false, error: 'Unauthorized: Only session host can toggle auto-reveal' });
          return;
        }

        room.autoReveal = autoReveal;
        broadcastRoomData(room);
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
                broadcastRoomData(room);
                broadcastVotesUpdate(room);
              }
            }
          }
        }, 3000);
        break;
      }
    }
  });
});

// Serve static files from the frontend build, if present (only exists after a production build;
// in dev the frontend is served separately by Vite)
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});