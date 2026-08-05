// src/pages/Home.tsx

import React from 'react';
import { Container, Typography, Button, Stack, Box, Paper, Grid, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LoginIcon from '@mui/icons-material/Login';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupsIcon from '@mui/icons-material/Groups';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, sm: 6 },
          borderRadius: 4,
          background: `
            radial-gradient(circle at -5% -10%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 105% 110%, rgba(37, 99, 235, 0.18) 0%, transparent 40%),
            linear-gradient(135deg, #0B1120 0%, #0F172A 40%, #1E293B 100%)
          `,
          color: '#ffffff',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          fontWeight="800"
          gutterBottom
          sx={{
            background: 'linear-gradient(90deg, #60A5FA 0%, #93C5FD 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}
        >
          Agile Teams, Simplified!
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.85, maxW: '600px', mx: 'auto', mb: 5, fontWeight: 400 }}>
          Real-time collaborative planning poker for agile engineering teams. Fast, unbiased, and accurate story point estimation.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2.5}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate('/create')}
            sx={{
              py: 1.75,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 3,
              backgroundColor: '#2563EB',
              '&:hover': { backgroundColor: '#1D4ED8' },
              boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)',
            }}
          >
            Create Room
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/join')}
            sx={{
              py: 1.75,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 3,
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            Join Room
          </Button>
        </Stack>
      </Paper>

      <Box display="flex" alignItems="center" justifyContent="center" gap={1} sx={{ mt: 3, opacity: 0.7 }}>
        <LockOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="body2" color="textSecondary">
          We don't store any of your data — rooms and votes exist only in memory for the session and disappear when everyone leaves.
        </Typography>
      </Box>

      {/* Feature Highlight Cards */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3, textAlign: 'center', height: '100%' }}>
            <SpeedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Instant Sync
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Real-time WebSockets keep all team members in sync with zero latency.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3, textAlign: 'center', height: '100%' }}>
            <VisibilityIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Hidden Votes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Prevent voting bias by keeping points hidden until everyone has voted.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3, textAlign: 'center', height: '100%' }}>
            <GroupsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Team Collaboration
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Share quick invite links for seamless sprint planning sessions.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box textAlign="center" sx={{ mt: 5, opacity: 0.85 }}>
        <Typography
          variant="body2"
          color="textSecondary"
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={0.75}
        >
          <GitHubIcon sx={{ fontSize: 18 }} />
          Poke-a-Point is open source on{' '}
          <Link
            href="https://github.com/keyurx11/Poke-a-Point"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ fontWeight: 'bold', color: 'primary.main' }}
          >
            GitHub
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;
