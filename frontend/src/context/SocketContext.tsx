// src/context/SocketContext.tsx

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useMemo(() => {
    const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    return io(socketURL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      // Rejoin room if roomId and userName are stored
      const roomId = localStorage.getItem('roomId');
      const userName = localStorage.getItem('userName');
      if (roomId && userName) {
        socket.emit('rejoinRoom', { roomId, userName }, (response: any) => {
          console.log('Rejoin response:', response);
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server, attempting reconnection...');
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
