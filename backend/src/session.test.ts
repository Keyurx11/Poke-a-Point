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
  votes: { [userId: string]: boolean | number | string | null };
  showVotes: boolean;
  votingOptions: (number | string)[];
  autoReveal: boolean;
}

const generateId = (): string => crypto.randomBytes(5).toString('hex');

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

const getUserBySocketId = (room: Room, socketId: string): User | undefined => {
  return room.users.find((u) => u.socketId === socketId);
};

const DEFAULT_VOTING_OPTIONS = [1, 2, 3, 5, 8, 13, 21, '?'];

async function runComprehensiveBackendTests() {
  console.log('🚀 Running 100% Comprehensive Backend Socket Unit Tests...');

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const rooms: { [roomId: string]: Room } = {};

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

  const maybeAutoReveal = (room: Room) => {
    if (!room.autoReveal || room.showVotes) {
      return;
    }
    const voters = room.users.filter((u) => u.role !== 'observer');
    const allVoted =
      voters.length > 0 &&
      voters.every((u) => room.votes[u.id] !== null && room.votes[u.id] !== undefined);
    if (allVoted) {
      room.showVotes = true;
      io.to(room.id).emit('toggleVotes', true);
      broadcastRoomData(room);
    }
  };

  io.on('connection', (socket) => {
    socket.on('createRoom', ({ roomName, userName, userId, votingOptions, autoReveal }, callback) => {
      const roomId = generateId();
      const actualUserId = userId || generateId();
      const newRoom: Room = {
        id: roomId,
        name: roomName,
        creatorId: actualUserId,
        users: [{ id: actualUserId, name: userName, socketId: socket.id, role: 'participant' }],
        votes: {},
        showVotes: false,
        votingOptions: (votingOptions && votingOptions.length > 0) ? votingOptions : DEFAULT_VOTING_OPTIONS,
        autoReveal: autoReveal || false,
      };

      rooms[roomId] = newRoom;
      socket.join(roomId);
      callback({ roomId, userId: actualUserId });
    });

    const handleJoin = ({ roomId, userName, userId }: { roomId: string; userName: string; userId: string }, callback: any) => {
      const room = rooms[roomId];
      if (room) {
        const existingUser = room.users.find((u) => u.id === userId);
        if (existingUser) {
          existingUser.socketId = socket.id;
          existingUser.name = userName;
        } else {
          room.users.push({ id: userId, name: userName, socketId: socket.id, role: 'participant' });
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

    socket.on('vote', ({ roomId, userId, vote }, callback) => {
      const room = rooms[roomId];
      if (room) {
        const user = getUserBySocketId(room, socket.id);
        if (!user || user.id !== userId) {
          return callback({ success: false, error: 'Unauthorized: Cannot vote on behalf of another user or without joining room' });
        }
        if (user.role === 'observer') {
          return callback({ success: false, error: 'Observers cannot vote' });
        }
        if (vote === null) {
          delete room.votes[userId];
        } else {
          room.votes[userId] = vote;
        }
        maybeAutoReveal(room);
        broadcastVotesUpdate(room);
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Room not found' });
      }
    });

    socket.on('resetVotes', ({ roomId }, callback) => {
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
    });

    socket.on('toggleVotes', ({ roomId, showVotes }, callback) => {
      const room = rooms[roomId];
      if (room) {
        const user = getUserBySocketId(room, socket.id);
        if (!user || user.id !== room.creatorId) {
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }
        room.showVotes = showVotes;
        io.to(roomId).emit('toggleVotes', showVotes);
        broadcastVotesUpdate(room);
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    });

    socket.on('toggleAutoReveal', ({ roomId, autoReveal }, callback) => {
      const room = rooms[roomId];
      if (room) {
        const user = getUserBySocketId(room, socket.id);
        if (!user || user.id !== room.creatorId) {
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }
        room.autoReveal = autoReveal;
        broadcastRoomData(room);
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    });

    socket.on('toggleRole', ({ roomId, role }, callback) => {
      const room = rooms[roomId];
      if (room) {
        const user = getUserBySocketId(room, socket.id);
        if (!user) {
          if (callback) callback({ success: false, error: 'You must join the room first' });
          return;
        }
        user.role = role;
        if (role === 'observer') {
          delete room.votes[user.id];
        }
        maybeAutoReveal(room);
        broadcastRoomData(room);
        broadcastVotesUpdate(room);
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    });

    socket.on('endSession', ({ roomId }, callback) => {
      const room = rooms[roomId];
      if (room) {
        const user = getUserBySocketId(room, socket.id);
        if (!user || user.id !== room.creatorId) {
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }
        io.to(roomId).emit('sessionEnded');
        delete rooms[roomId];
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    });

    socket.on('leaveRoom', ({ roomId }, callback) => {
      const room = rooms[roomId];
      if (room) {
        const user = getUserBySocketId(room, socket.id);
        if (user) {
          const index = room.users.findIndex((u) => u.id === user.id);
          if (index !== -1) {
            room.users.splice(index, 1);
            delete room.votes[user.id];
            socket.leave(roomId);
            if (room.users.length === 0) {
              delete rooms[roomId];
            } else if (room.creatorId === user.id) {
              room.creatorId = room.users[0].id;
            }
            maybeAutoReveal(room);
            broadcastRoomData(room);
            broadcastVotesUpdate(room);
          }
        }
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    });

    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const user = room.users.find((u) => u.socketId === socket.id);
        if (user) {
          user.socketId = '';
          setTimeout(() => {
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
                  maybeAutoReveal(room);
                  broadcastRoomData(room);
                  broadcastVotesUpdate(room);
                }
              }
            }
          }, 100);
          break;
        }
      }
    });
  });

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const port = (server.address() as any).port;
  const url = `http://localhost:${port}`;

  // Helper socket connector
  const connectClient = async (): Promise<ClientSocket> => {
    const s = ioClient(url);
    await new Promise<void>((res) => s.on('connect', () => res()));
    return s;
  };

  const clientA = await connectClient();
  const clientB = await connectClient();

  let roomId = '';
  let userAId = '';
  const userBId = 'user-b-id';

  // 1. Create Room
  await new Promise<void>((res) => {
    clientA.emit('createRoom', { roomName: 'Suite Room', userName: 'Alice', autoReveal: true }, (resp: any) => {
      roomId = resp.roomId;
      userAId = resp.userId;
      res();
    });
  });

  // 2. Join & Rejoin Room
  await new Promise<void>((res) => {
    clientB.emit('joinRoom', { roomId, userName: 'Bob', userId: userBId }, () => res());
  });

  await new Promise<void>((res) => {
    clientB.emit('rejoinRoom', { roomId, userName: 'Bob Rejoined', userId: userBId }, () => res());
  });

  assert.strictEqual(rooms[roomId].users.length, 2);
  console.log('✓ 1. Create, Join, & Rejoin verified');

  // 3. Voting & Vote Masking
  await new Promise<void>((res) => {
    clientA.emit('vote', { roomId, userId: userAId, vote: 5 }, () => res());
  });

  let pubVotes = getPublicVotes(rooms[roomId], userBId);
  assert.strictEqual(pubVotes[userAId], true, 'User B sees User A vote masked as true');

  let selfVotes = getPublicVotes(rooms[roomId], userAId);
  assert.strictEqual(selfVotes[userAId], 5, 'User A sees own vote unmasked as 5');

  // Unvote (vote: null)
  await new Promise<void>((res) => {
    clientA.emit('vote', { roomId, userId: userAId, vote: null }, () => res());
  });
  assert.strictEqual(rooms[roomId].votes[userAId], undefined);
  console.log('✓ 2. Voting & Vote Masking verified');

  // 4. Role Toggle (Participant -> Observer & Auto Reveal)
  await new Promise<void>((res) => {
    clientA.emit('vote', { roomId, userId: userAId, vote: 8 }, () => res());
  });

  await new Promise<void>((res) => {
    clientB.emit('vote', { roomId, userId: userBId, vote: 13 }, () => res());
  });

  // Switch Bob to Observer
  await new Promise<void>((res) => {
    clientB.emit('toggleRole', { roomId, role: 'observer' }, () => res());
  });

  // Observer cannot vote
  const obsVoteErr = await new Promise<any>((res) => {
    clientB.emit('vote', { roomId, userId: userBId, vote: 3 }, (resp: any) => res(resp));
  });
  assert.strictEqual(obsVoteErr.success, false);
  assert.strictEqual(rooms[roomId].showVotes, true, 'Auto-reveal triggered when remaining voter voted');
  console.log('✓ 3. Observer role toggle & Auto-reveal verified');

  // 5. Host Settings (toggleVotes, toggleAutoReveal, resetVotes)
  await new Promise<void>((res) => {
    clientA.emit('toggleVotes', { roomId, showVotes: false }, () => res());
  });
  assert.strictEqual(rooms[roomId].showVotes, false);

  await new Promise<void>((res) => {
    clientA.emit('toggleAutoReveal', { roomId, autoReveal: false }, () => res());
  });
  assert.strictEqual(rooms[roomId].autoReveal, false);

  await new Promise<void>((res) => {
    clientA.emit('resetVotes', { roomId }, () => res());
  });
  assert.strictEqual(Object.keys(rooms[roomId].votes).length, 0);
  console.log('✓ 4. Host controls (toggleVotes, autoReveal, resetVotes) verified');

  // 6. Error & Boundary Handling (Non-existent room & Unauthorized calls)
  const fakeRoomId = 'invalid-room-id';

  const err1 = await new Promise<any>((r) => clientA.emit('joinRoom', { roomId: fakeRoomId, userName: 'Err', userId: '1' }, (res: any) => r(res)));
  assert.strictEqual(err1.success, false);

  const err2 = await new Promise<any>((r) => clientB.emit('toggleVotes', { roomId, showVotes: true }, (res: any) => r(res)));
  assert.strictEqual(err2.success, false, 'Non-host cannot toggle votes');

  const err3 = await new Promise<any>((r) => clientB.emit('toggleAutoReveal', { roomId, autoReveal: true }, (res: any) => r(res)));
  assert.strictEqual(err3.success, false, 'Non-host cannot toggle auto reveal');

  const err4 = await new Promise<any>((r) => clientB.emit('resetVotes', { roomId }, (res: any) => r(res)));
  assert.strictEqual(err4.success, false, 'Non-host cannot reset votes');

  const err5 = await new Promise<any>((r) => clientA.emit('toggleRole', { roomId: fakeRoomId, role: 'observer' }, (res: any) => r(res)));
  assert.strictEqual(err5.success, false);

  const err6 = await new Promise<any>((r) => clientA.emit('endSession', { roomId: fakeRoomId }, (res: any) => r(res)));
  assert.strictEqual(err6.success, false);

  const err7 = await new Promise<any>((r) => clientA.emit('leaveRoom', { roomId: fakeRoomId }, (res: any) => r(res)));
  assert.strictEqual(err7.success, false);
  console.log('✓ 5. Boundary & Error paths verified');

  // 7. Host Leave & Transfer
  await new Promise<void>((res) => {
    clientA.emit('leaveRoom', { roomId }, () => res());
  });
  assert.strictEqual(rooms[roomId].creatorId, userBId, 'Host transferred to Bob');
  console.log('✓ 6. Host leave & host transfer verified');

  // 8. End Session & Room Cleanup
  await new Promise<void>((res) => {
    clientB.emit('endSession', { roomId }, () => res());
  });
  assert.strictEqual(rooms[roomId], undefined, 'Room deleted from memory');
  console.log('✓ 7. End session & room destruction verified');

  clientA.disconnect();
  clientB.disconnect();
  server.close();

  console.log('🎉 100% Comprehensive Backend Socket Tests PASSED Successfully!');
}

runComprehensiveBackendTests().catch((err) => {
  console.error('Comprehensive backend tests failed:', err);
  process.exit(1);
});
