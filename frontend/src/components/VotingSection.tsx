// src/components/VotingSection.tsx

import React from 'react';
import { Grid, Button, Paper, Typography, Box } from '@mui/material';

interface VotingSectionProps {
  votingOptions: (number | string)[];
  selectedVote: number | string | null;
  handleVote: (vote: number | string) => void;
  handleResetMyVote: () => void;
}

const VotingSection: React.FC<VotingSectionProps> = ({
  votingOptions,
  selectedVote,
  handleVote,
  handleResetMyVote,
}) => (
  <Paper
    elevation={1}
    sx={{
      padding: 2,
      borderRadius: 2.5,
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" color="textPrimary">
        Cast Your Vote
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5 }}>
        Select a card estimation value below
      </Typography>

      <Grid container spacing={1}>
        {votingOptions.map((option) => {
          const isSelected = selectedVote === option;

          return (
            <Grid item xs={3} sm={3} key={option}>
              <Button
                variant={isSelected ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => handleVote(option)}
                sx={{
                  width: '100%',
                  height: '52px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 1.75,
                  textTransform: 'none',
                  transition: 'all 0.2s ease-in-out',
                  transform: isSelected ? 'scale(1.05)' : 'none',
                  boxShadow: isSelected
                    ? '0 6px 16px rgba(25, 118, 210, 0.4)'
                    : 'none',
                  borderColor: isSelected ? '#1976D2' : '#CBD5E1',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                {option}
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Box>

    <Box mt={3} textAlign="right">
      <Button
        variant="text"
        onClick={handleResetMyVote}
        disabled={selectedVote === null}
        sx={{
          fontWeight: 'bold',
          textTransform: 'none',
          color: '#64748B',
          '&:hover': { color: '#334155', backgroundColor: 'rgba(100, 116, 139, 0.08)' },
        }}
      >
        Clear My Selection
      </Button>
    </Box>
  </Paper>
);

export default VotingSection;
