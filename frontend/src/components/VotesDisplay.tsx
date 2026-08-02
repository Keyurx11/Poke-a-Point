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
  const getAverageDetails = () => {
    const voteValues = users
      .map((user) => {
        const val = votes[user.id];
        if (val !== null && val !== undefined && !isNaN(Number(val)) && val !== '?') {
          return Number(val);
        }
        return null;
      })
      .filter((vote): vote is number => vote !== null);

    if (voteValues.length === 0) return null;

    const sum = voteValues.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / voteValues.length;
    const formattedAvg = Number.isInteger(avg) ? avg.toString() : avg.toFixed(1);

    const numericOptions = votingOptions.filter((opt): opt is number => typeof opt === 'number');
    let closestOpt = numericOptions[0];
    if (numericOptions.length > 0) {
      closestOpt = numericOptions.reduce((prev, curr) =>
        Math.abs(curr - avg) < Math.abs(prev - avg) ? curr : prev
      );
    }

    return { average: formattedAvg, closest: closestOpt, count: voteValues.length };
  };

  const stats = getAverageDetails();

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%)',
        border: '1px solid #e2e8f0',
      }}
    >
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={2}
        marginBottom={3}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold" color="textPrimary">
            {showVotes ? 'Session Results' : 'Voting Results (Hidden)'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {users.length} {users.length === 1 ? 'Participant' : 'Participants'}
          </Typography>
        </Box>

        {isCreator && (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color={showVotes ? 'warning' : 'success'}
              onClick={handleToggleVotes}
              sx={{ fontWeight: 'bold', borderRadius: 2 }}
            >
              {showVotes ? 'Hide Points' : 'Show Points'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleResetVotes}
              sx={{ fontWeight: 'bold', borderRadius: 2 }}
            >
              Reset All Votes
            </Button>
          </Box>
        )}
      </Box>

      {showVotes && stats && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#ffffff',
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Average: {stats.average} Story Points
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            Nearest Poker Card: {stats.closest} ({stats.count} {stats.count === 1 ? 'numeric vote' : 'numeric votes'})
          </Typography>
        </Paper>
      )}

      <Grid container spacing={2}>
        {users.map((user) => {
          const userVote = votes[user.id];
          const hasVoted = userVote !== undefined && userVote !== null;

          return (
            <Grid item xs={6} sm={4} md={3} key={user.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  },
                  border: hasVoted
                    ? showVotes
                      ? '2px solid #3B82F6'
                      : '2px solid #10B981'
                    : '1px solid #E2E8F0',
                  backgroundColor: hasVoted ? '#F0FDF4' : '#FFFFFF',
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {user.name}
                  </Typography>
                  <Box
                    sx={{
                      mt: 1.5,
                      py: 1,
                      px: 2,
                      borderRadius: 2,
                      display: 'inline-block',
                      minWidth: '60px',
                      backgroundColor: !hasVoted
                        ? '#F1F5F9'
                        : showVotes
                        ? '#3B82F6'
                        : '#10B981',
                      color: !hasVoted ? '#64748B' : '#FFFFFF',
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      {!hasVoted ? 'Thinking...' : showVotes ? userVote : '✓ Voted'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default VotesDisplay;
