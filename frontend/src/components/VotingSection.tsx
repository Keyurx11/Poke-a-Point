// src/components/VotingSection.tsx

import React from 'react';
import { Grid, Button, Paper, Typography } from '@mui/material';

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

    <Button
      variant="outlined"
      color="secondary"
      onClick={handleResetMyVote}
      sx={{ marginTop: 2 }}
    >
      Reset My Vote
    </Button>
  </Paper>
);

export default VotingSection;
