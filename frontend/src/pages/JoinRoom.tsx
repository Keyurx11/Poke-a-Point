// src/pages/JoinRoom.tsx

import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const JoinRoom: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomIdFromUrl = params.get('roomId');
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
    }
  }, [location.search]);

  const handleJoin = () => {
    if (!socket || !socket.connected) {
      setError('Socket not connected. Please wait and try again.');
      return;
    }

    if (!roomId || !userName) {
      setError('Room ID and User Name are required.');
      return;
    }

    setError(null);
    localStorage.setItem('userName', userName);
    localStorage.setItem('roomId', roomId);

    socket.emit(
      'joinRoom',
      { roomId, userName },
      (response: { success?: boolean; room?: any; error?: string }) => {
        if (response.success) {
          console.log(`Joined room: ${roomId}`);
          navigate(`/room/${roomId}`);
        } else {
          setError(response.error || 'Failed to join room. Please check the Room ID.');
        }
      }
    );
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ marginTop: 8 }}>
        <Typography variant="h5" gutterBottom>
          Join an Existing Room
        </Typography>
        <TextField
          fullWidth
          label="Room ID"
          variant="outlined"
          margin="normal"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <TextField
          fullWidth
          label="Your Name"
          variant="outlined"
          margin="normal"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleJoin}
          sx={{ marginTop: 2 }}
        >
          Join Room
        </Button>
      </Box>
    </Container>
  );
};

export default JoinRoom;
