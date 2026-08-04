// src/components/ParticipantsList.tsx

import React from 'react';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Paper, Chip, Box } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

interface ParticipantsListProps {
  users: { id: string; name: string }[];
  votes?: { [key: string]: number | string | null };
  showVotes?: boolean;
  creatorId?: string;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ users, votes = {}, showVotes = false, creatorId }) => (
  <Paper
    elevation={2}
    sx={{
      padding: 3,
      borderRadius: 3,
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      height: '100%',
    }}
  >
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="h6" fontWeight="bold" color="textPrimary">
        Team Members
      </Typography>
      <Chip
        label={`${users.length} Online`}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 'bold' }}
      />
    </Box>

    <List sx={{ width: '100%', py: 0 }}>
      {users.map((user, idx) => {
        const hasVoted = votes[user.id] !== undefined && votes[user.id] !== null;
        const isHost = idx === 0 || user.id === creatorId;

        return (
          <ListItem
            key={user.id}
            sx={{
              px: 2,
              py: 1.25,
              mb: 1,
              borderRadius: 2,
              backgroundColor: '#f8fafc',
              border: '1px solid #f1f5f9',
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: isHost ? '#1E293B' : '#3B82F6', width: 36, height: 36 }}>
                {isHost ? <StarIcon fontSize="small" sx={{ color: '#F59E0B' }} /> : user.name.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {user.name}
                  </Typography>
                  {isHost && (
                    <Chip label="Host" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 'bold' }} />
                  )}
                </Box>
              }
              secondary={
                hasVoted ? (
                  showVotes ? `Voted: ${votes[user.id]}` : 'Vote Submitted'
                ) : (
                  'Voting...'
                )
              }
            />
            {hasVoted ? (
              <CheckCircleIcon color="success" fontSize="small" />
            ) : (
              <HourglassEmptyIcon color="action" fontSize="small" />
            )}
          </ListItem>
        );
      })}
    </List>
  </Paper>
);

export default ParticipantsList;
