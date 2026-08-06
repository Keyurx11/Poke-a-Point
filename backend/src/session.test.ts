import assert from 'assert';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import crypto from 'crypto';

interface User {
  id: string;
  name: string;
  socketId: string;
  role: 'participant' | 'observer';
}

interface Room {
  id: string;
  name: string;
  creatorId: string;
  users: User[];
  votes: { [userId: string]: number | string | null };
  showVotes: boolean;
  votingOptions: (number | string)[];
  autoReveal: boolean;
}

const generateId = (): string => crypto.randomBytes(5).toString('hex');

async function runSessionUnitTests() {
  console.log('Running backend socket unit tests for Leave Room & End Session...');

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const rooms: { [roomId: string]: Room } = {};

  io.on('connection', (socket) => {
    socket.on('createRoom', ({ roomName, userName, userId }, callback) => {
      const roomId = generateId();
      const actualUserId = userId || generateId();
      rooms[roomId] = {
        id: roomId,
        name: roomName,
        creatorId: actualUserId,
        users: [{ id: actualUserId, name: userName, socketId: socket.id, role: 'participant' }],
        votes: {},
        showVotes: false,
        votingOptions: [1, 2, 3, 5, 8],
        autoReveal: false,
      };
      socket.join(roomId);
      callback({ roomId, userId: actualUserId });
    });

    socket.on('joinRoom', ({ roomId, userName, userId }, callback) => {
      const room = rooms[roomId];
      if (room) {
        room.users.push({ id: userId, name: userName, socketId: socket.id, role: 'participant' });
        socket.join(roomId);
        callback({ success: true, room });
      }
    });

    socket.on('leaveRoom', ({ roomId }, callback) => {
      const room = rooms[roomId];
      if (room) {
        const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
        if (userIndex !== -1) {
          const leavingUser = room.users[userIndex];
          room.users.splice(userIndex, 1);
          delete room.votes[leavingUser.id];
          socket.leave(roomId);

          if (room.users.length === 0) {
            delete rooms[roomId];
          } else if (room.creatorId === leavingUser.id) {
            room.creatorId = room.users[0].id;
          }
        }
        if (callback) callback({ success: true });
      }
    });

    socket.on('endSession', ({ roomId }, callback) => {
      const room = rooms[roomId];
      if (room) {
        const user = room.users.find((u) => u.socketId === socket.id);
        if (!user || user.id !== room.creatorId) {
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }
        io.to(roomId).emit('sessionEnded');
        delete rooms[roomId];
        if (callback) callback({ success: true });
      }
    });
  });

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const port = (server.address() as any).port;
  const url = `http://localhost:${port}`;

  const hostSock: ClientSocket = ioClient(url);
  const user2Sock: ClientSocket = ioClient(url);

  await new Promise<void>((res) => hostSock.on('connect', () => res()));
  await new Promise<void>((res) => user2Sock.on('connect', () => res()));

  let roomId = '';
  let hostId = '';
  const user2Id = 'user-2-id';

  await new Promise<void>((res) => {
    hostSock.emit('createRoom', { roomName: 'Test Room', userName: 'Host' }, (resp: any) => {
      roomId = resp.roomId;
      hostId = resp.userId;
      res();
    });
  });

  await new Promise<void>((res) => {
    user2Sock.emit('joinRoom', { roomId, userName: 'User 2', userId: user2Id }, () => res());
  });

  assert.strictEqual(rooms[roomId].creatorId, hostId);
  assert.strictEqual(rooms[roomId].users.length, 2);

  // Test 1: Non-host (User 2) attempting to end session while Host 1 is host -> fails
  const unauthorizedResp = await new Promise<any>((res) => {
    user2Sock.emit('endSession', { roomId }, (resp: any) => res(resp));
  });
  assert.strictEqual(unauthorizedResp.success, false);
  assert.strictEqual(unauthorizedResp.error, 'Unauthorized');
  console.log('✓ Test 1 passed: Non-host cannot end session');

  // Test 2: Host 1 leaves room -> ownership transfers to User 2
  await new Promise<void>((res) => {
    hostSock.emit('leaveRoom', { roomId }, () => res());
  });

  assert.strictEqual(rooms[roomId].users.length, 1);
  assert.strictEqual(rooms[roomId].creatorId, user2Id, 'Creator ID should transfer to User 2');
  console.log('✓ Test 2 passed: Host leave successfully transferred ownership to User 2');

  // Test 3: Authorized new host (User 2) ends session -> sessionEnded broadcast & room deleted
  let sessionEndedReceived = false;
  user2Sock.on('sessionEnded', () => {
    sessionEndedReceived = true;
  });

  const endResp = await new Promise<any>((res) => {
    user2Sock.emit('endSession', { roomId }, (resp: any) => res(resp));
  });

  assert.strictEqual(endResp.success, true);
  await new Promise((r) => setTimeout(r, 100));
  assert.strictEqual(sessionEndedReceived, true, 'User 2 should receive sessionEnded broadcast');
  assert.strictEqual(rooms[roomId], undefined, 'Room should be deleted from memory');
  console.log('✓ Test 3 passed: Host ending session broadcasts sessionEnded and deletes room');

  hostSock.disconnect();
  user2Sock.disconnect();
  server.close();
  console.log('All backend socket unit tests completed successfully!');
}

runSessionUnitTests().catch((err) => {
  console.error('Unit tests failed:', err);
  process.exit(1);
});
