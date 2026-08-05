// src/components/ParticipantsList.tsx

import React from 'react';
import { Grid, Typography, Paper, Chip, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface ParticipantsListProps {
  users: { id: string; name: string; role?: 'participant' | 'operator' }[];
  votes?: { [key: string]: number | string | null };
  showVotes?: boolean;
  creatorId?: string;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ users, votes = {}, showVotes = false, creatorId }) => (
  <Paper
    elevation={1}
    sx={{
      padding: 2,
      paddingBottom: 3,
      borderRadius: 2.5,
      background: 'linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%)',
      border: '1px solid #e2e8f0',
      height: '100%',
    }}
  >
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
      <Typography variant="subtitle1" fontWeight="bold" color="textPrimary">
        Team Members
      </Typography>
      <Chip
        label={`${users.length} Online`}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 'bold', height: 22, fontSize: '0.75rem' }}
      />
    </Box>

    <Grid container spacing={1} justifyContent="center">
      {users.map((user, idx) => {
        const hasVoted = votes[user.id] !== undefined && votes[user.id] !== null;
        const isHost = idx === 0 || user.id === creatorId;
        const isObserver = user.role === 'operator';
        const userVoteVal = votes[user.id];

        return (
          <Grid item xs={6} sm={4} md={3} lg={2} key={user.id}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                backgroundColor: '#1E293B',
                borderLeft: isObserver ? '3px solid #FBBF24' : hasVoted ? '3px solid #4ADE80' : '3px solid #475569',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 0.75,
              }}
            >
              <Box minWidth={0}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ color: '#ffffff' }}>
                    {user.name}
                  </Typography>
                  {isHost && (
                    <Chip label="H" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 'bold', px: 0.25 }} />
                  )}

                </Box>
                <Typography variant="caption" noWrap sx={{ fontSize: '0.7rem', display: 'block', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {isObserver ? 'Observing' : hasVoted ? (showVotes ? `Voted: ${userVoteVal}` : 'Vote Submitted') : 'Voting...'}
                </Typography>
              </Box>

              {isObserver ? (
                <VisibilityIcon sx={{ fontSize: '1.1rem', flexShrink: 0, color: '#FBBF24' }} />
              ) : hasVoted ? (
                <CheckCircleIcon sx={{ fontSize: '1.1rem', flexShrink: 0, color: '#4ADE80' }} />
              ) : (
                <HourglassEmptyIcon sx={{ fontSize: '1.1rem', flexShrink: 0, color: 'rgba(255, 255, 255, 0.5)' }} />
              )}
            </Box>
          </Grid>
        );
      })}
    </Grid>
  </Paper>
);

export default ParticipantsList;
