// src/components/VotingSection.tsx

import React from 'react';
import { Grid, Button, Paper, Box, Typography } from '@mui/material';

interface VotingSectionProps {
  votingOptions: (number | string)[];
  selectedVote: number | string | null;
  handleVote: (vote: number | string) => void;
  handleResetVotes: () => void;
  handleResetMyVote: () => void;
  handleToggleVotes: () => void;
  showVotes: boolean;
  isCreator: boolean;
}

const VotingSection: React.FC<VotingSectionProps> = ({
  votingOptions,
  selectedVote,
  handleVote,
  handleResetVotes,
  handleResetMyVote,
  handleToggleVotes,
  showVotes,
  isCreator,
}) => (
  <Paper sx={{ padding: 2 }}>
    <Typography variant="h6" gutterBottom>
      Voting
    </Typography>
    <Grid container spacing={1}>
      {votingOptions.map((option) => (
        <Grid item key={option}>
          <Button
            variant={selectedVote === option ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleVote(option)}
            sx={{ minWidth: '60px' }}
          >
            {option}
          </Button>
        </Grid>
      ))}
    </Grid>

    <Box sx={{ marginTop: 2 }}>
      <Button variant="outlined" color="secondary" onClick={handleResetMyVote}>
        Reset My Vote
      </Button>

      {isCreator && (
        <>
          <Button variant="outlined" color="primary" onClick={handleToggleVotes} sx={{ marginLeft: 2 }}>
            {showVotes ? 'Hide Votes' : 'Show Votes'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleResetVotes} sx={{ marginLeft: 2 }}>
            Reset All Votes
          </Button>
        </>
      )}
    </Box>
  </Paper>
);

export default VotingSection;
