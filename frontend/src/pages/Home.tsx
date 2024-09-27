// src/pages/Home.tsx

import React from 'react';
import { Container, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', marginTop: 8 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to CFF Planning Poker
      </Typography>
      <Stack spacing={2} direction="column">
        <Button variant="contained" color="primary" onClick={() => navigate('/create')}>
          Create Room
        </Button>
        <Button variant="outlined" color="primary" onClick={() => navigate('/join')}>
          Join Room
        </Button>
      </Stack>
    </Container>
  );
};

export default Home;
