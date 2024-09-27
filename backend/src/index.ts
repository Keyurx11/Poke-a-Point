import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Socket.IO backend is working');
});

// In-memory storage (use a database in production)
const rooms: { [key: string]: any } = {};

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create Room
  socket.on('createRoom', ({ roomName, userName }: { roomName: string; userName: string }, callback: Function) => {
    const roomId = generateId();
    rooms[roomId] = {
      id: roomId,
      name: roomName,
      users: [{ id: socket.id, name: userName }],
      votes: {},
    };

    socket.join(roomId);
    callback({ roomId });
    io.to(roomId).emit('roomData', rooms[roomId]);
  });

  // Join Room
  socket.on('joinRoom', ({ roomId, userName }: { roomId: string; userName: string }, callback: Function) => {
    const room = rooms[roomId];
    if (room) {
      const userExists = room.users.some((user: any) => user.id === socket.id);
      if (!userExists) {
        room.users.push({ id: socket.id, name: userName });
      }
      socket.join(roomId);
      callback({ success: true, room });
      io.to(roomId).emit('roomData', room);
    } else {
      callback({ success: false, message: 'Room not found' });
    }
  });

  // Rejoin Room
  socket.on('rejoinRoom', ({ roomId, userName }: { roomId: string; userName: string }) => {
    const room = rooms[roomId];
    if (room) {
      const userExists = room.users.some((user: any) => user.id === socket.id);
      if (!userExists) {
        room.users.push({ id: socket.id, name: userName });
      }
      socket.join(roomId);
      io.to(roomId).emit('roomData', room);
    }
  });

  // Vote event
  socket.on('vote', ({ roomId, userId, vote }: { roomId: string; userId: string; vote: any }, callback: Function) => {
    const room = rooms[roomId];
    if (room) {
      room.votes[userId] = vote; 
      io.to(roomId).emit('votesUpdate', room.votes); 
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Room not found' });
    }
  });

  // Reset Votes event
  socket.on('resetVotes', ({ roomId }: { roomId: string }, callback: Function) => {
    const room = rooms[roomId];
    if (room) {
      room.votes = {}; 
      io.to(roomId).emit('votesUpdate', room.votes); 
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Room not found' });
    }
  });

  // Toggle votes visibility event
  socket.on('toggleVotes', ({ roomId, showVotes }: { roomId: string; showVotes: boolean }) => {
    const room = rooms[roomId];
    if (room) {
      io.to(roomId).emit('toggleVotes', showVotes); 
    }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const userIndex = room.users.findIndex((user: any) => user.id === socket.id);
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        io.to(roomId).emit('roomData', room);
        break;
      }
    }
  });
});

// Utility function to generate unique room IDs
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
