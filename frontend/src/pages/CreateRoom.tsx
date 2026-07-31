// src/pages/CreateRoom.tsx

import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { getUserId } from '../utils/userSession';

const CreateRoom: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const socket = useSocket();

  const handleCreate = () => {
    if (!roomName.trim() || !userName.trim()) {
      setError('Room Name and User Name are required.');
      return;
    }

    if (!socket.connected) {
      setError('Connecting to server... Please wait a moment and try again.');
      return;
    }

    setError(null);
    const userId = getUserId();
    localStorage.setItem('userName', userName.trim());

    socket.emit(
      'createRoom',
      { roomName: roomName.trim(), userName: userName.trim(), userId },
      ({ roomId, error: createError }: { roomId?: string; userId?: string; error?: string }) => {
        if (roomId) {
          console.log(`Room created with ID: ${roomId}`);
          localStorage.setItem('roomId', roomId);
          navigate(`/room/${roomId}`);
        } else {
          setError(createError || 'Failed to create room. Please try again.');
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
          Create a New Room
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Set up an Agile estimation session for your team
        </Typography>

        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <TextField
            fullWidth
            label="Room Name"
            variant="outlined"
            margin="normal"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Sprint 42 Planning"
            required
          />
          <TextField
            fullWidth
            label="Your Name"
            variant="outlined"
            margin="normal"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Alice"
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
            Create Room
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateRoom;
