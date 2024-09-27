import React from 'react';
import { Grid, Button, Paper, Box, Typography } from '@mui/material';

interface VotingSectionProps {
  votingOptions: (number | string)[];
  selectedVote: number | string | null;
  handleVote: (vote: number | string) => void;
  handleResetVotes: () => void;
  handleResetMyVote: () => void; // New handler for individual vote reset
  handleToggleVotes: () => void;
  showVotes: boolean;
  isCreator: boolean; // Added to distinguish between creator and participants
}

const VotingSection: React.FC<VotingSectionProps> = ({
  votingOptions,
  selectedVote,
  handleVote,
  handleResetVotes,
  handleResetMyVote,
  handleToggleVotes,
  showVotes,
  isCreator, // Distinguish between creator and participants
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
          >
            {option}
          </Button>
        </Grid>
      ))}
    </Grid>

    <Box sx={{ marginTop: 2 }}>
      {/* Show reset button for everyone */}
      <Button
        variant="outlined"
        color="secondary"
        onClick={isCreator ? handleResetVotes : handleResetMyVote} // Different behavior for creator and participants
      >
        {isCreator ? 'Reset All Votes' : 'Reset My Vote'}
      </Button>

      {/* Only show the show/hide votes button for the creator */}
      {isCreator && (
        <Button variant="outlined" color="primary" onClick={handleToggleVotes} sx={{ marginLeft: 2 }}>
          {showVotes ? 'Hide Votes' : 'Show Votes'}
        </Button>
      )}
    </Box>
  </Paper>
);

export default VotingSection;
