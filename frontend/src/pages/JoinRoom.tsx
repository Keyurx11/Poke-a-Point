// src/pages/JoinRoom.tsx

import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Box, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { getUserId } from '../utils/userSession';

const JoinRoom: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
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
      setError('Socket not connected. Please wait a moment and try again.');
      return;
    }

    if (!roomId.trim() || !userName.trim()) {
      setError('Room ID and User Name are required.');
      return;
    }

    setError(null);
    const userId = getUserId();
    const cleanRoomId = roomId.trim();
    const cleanUserName = userName.trim();

    localStorage.setItem('userName', cleanUserName);
    localStorage.setItem('roomId', cleanRoomId);

    socket.emit(
      'joinRoom',
      { roomId: cleanRoomId, userName: cleanUserName, userId },
      (response: { success?: boolean; room?: any; error?: string }) => {
        if (response.success) {
          console.log(`Joined room: ${cleanRoomId}`);
          navigate(`/room/${cleanRoomId}`);
        } else {
          setError(response.error || 'Failed to join room. Please check the Room ID.');
        }
      }
    );
  };

  return (
    <Container maxWidth="xs">
      <Paper
        elevation={6}
        sx={{
          p: 4,
          mt: 6,
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
        }}
      >
        <Typography variant="h5" align="center" fontWeight="bold" color="primary" gutterBottom>
          Join a Room
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Enter room code to participate in planning poker
        </Typography>

        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleJoin(); }}>
          <TextField
            fullWidth
            label="Room ID"
            variant="outlined"
            margin="normal"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="e.g. 32hlo7r0g"
            required
          />
          <TextField
            fullWidth
            label="Your Name"
            variant="outlined"
            margin="normal"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Bob"
            required
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{
              mt: 3,
              py: 1.5,
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)',
            }}
          >
            Join Room
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default JoinRoom;
