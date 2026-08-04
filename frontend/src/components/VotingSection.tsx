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
    elevation={2}
    sx={{
      padding: 3,
      borderRadius: 3,
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <Box>
      <Typography variant="h6" fontWeight="bold" color="textPrimary" gutterBottom>
        Cast Your Vote
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5 }}>
        Select a card estimation value below
      </Typography>

      <Grid container spacing={1.5}>
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
                  height: '70px',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
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
        color="secondary"
        onClick={handleResetMyVote}
        disabled={selectedVote === null}
        sx={{ fontWeight: 'bold', textTransform: 'none' }}
      >
        Clear My Selection
      </Button>
    </Box>
  </Paper>
);

export default VotingSection;
