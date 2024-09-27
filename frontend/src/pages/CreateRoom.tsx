// src/pages/CreateRoom.tsx

import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const CreateRoom: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const socket = useSocket();

  const handleCreate = () => {
    if (!roomName || !userName) {
      setError('Room Name and User Name are required.');
      return;
    }

    setError(null);
    localStorage.setItem('userName', userName);

    socket.emit('createRoom', { roomName, userName }, ({ roomId }: { roomId: string }) => {
      if (roomId) {
        console.log(`Room created with ID: ${roomId}`);
        localStorage.setItem('roomId', roomId);
        navigate(`/room/${roomId}`);
      } else {
        setError('Failed to create room. Please try again.');
      }
    });
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ marginTop: 8 }}>
        <Typography variant="h5" gutterBottom>
          Create a New Room
        </Typography>
        <TextField
          fullWidth
          label="Room Name"
          variant="outlined"
          margin="normal"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
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
          onClick={handleCreate}
          sx={{ marginTop: 2 }}
        >
          Create Room
        </Button>
      </Box>
    </Container>
  );
};

export default CreateRoom;
