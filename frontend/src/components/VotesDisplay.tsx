// src/components/VotesDisplay.tsx

import React from 'react';
import { Grid, Card, CardContent, Typography, Paper, Button, Box } from '@mui/material';

interface VotesDisplayProps {
  users: { id: string; name: string }[];
  votes: { [key: string]: number | string | null };
  showVotes: boolean;
  votingOptions: (number | string)[];
  isCreator: boolean;
  handleResetVotes: () => void;
  handleToggleVotes: () => void;
}

const VotesDisplay: React.FC<VotesDisplayProps> = ({
  users,
  votes,
  showVotes,
  votingOptions,
  isCreator,
  handleResetVotes,
  handleToggleVotes,
}) => {
  const calculateAverageVote = () => {
    const voteValues = users
      .map((user) => (typeof votes[user.id] === 'number' ? Number(votes[user.id]) : null))
      .filter((vote) => vote !== null) as number[];

    if (voteValues.length === 0) return null;

    const average = voteValues.reduce((sum, vote) => sum + vote, 0) / voteValues.length;

    const closestVote = votingOptions
      .filter((option) => typeof option === 'number')
      .reduce((prev, curr) =>
        Math.abs((curr as number) - average) < Math.abs((prev as number) - average) ? curr : prev
      );

    return closestVote;
  };

  const averageVote = calculateAverageVote();

  return (
    <Paper sx={{ padding: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
        <Typography variant="h6">
          {showVotes ? 'Votes' : 'Votes Hidden'}
        </Typography>

        {/* Only show the buttons if the user is the creator */}
        {isCreator && (
          <Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleToggleVotes}
              sx={{ marginRight: 1 }}
            >
              {showVotes ? 'Hide Points' : 'Show Points'}
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleResetVotes}>
              Reset All Votes
            </Button>
          </Box>
        )}
      </Box>

      {showVotes && averageVote !== null && (
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 2 }}
        >
          Average: {averageVote}
        </Typography>
      )}

      <Grid container spacing={2}>
        {users.map((user) => (
          <Grid item xs={6} sm={4} md={3} key={user.id}>
            <Card variant="outlined" sx={{ backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {user.name}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', fontSize: '1.5rem', textAlign: 'center' }}
                >
                  {votes[user.id] === null || votes[user.id] === undefined
                    ? 'No vote'
                    : showVotes
                    ? votes[user.id]
                    : 'Voted'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default VotesDisplay;
