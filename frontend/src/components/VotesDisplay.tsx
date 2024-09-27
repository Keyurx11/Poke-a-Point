import React from 'react';
import { List, ListItem, Typography, Grid, Card, CardContent, Paper } from '@mui/material';

interface VotesDisplayProps {
  users: { id: string; name: string }[];
  votes: { [key: string]: number | string | null };  // Add `null` as a valid vote type
  showVotes: boolean;
  votingOptions: (number | string)[];
}

const VotesDisplay: React.FC<VotesDisplayProps> = ({ users, votes, showVotes, votingOptions }) => {
  
  const calculateAverageVote = () => {
    const voteValues = users
      .map(user => typeof votes[user.id] === 'number' ? Number(votes[user.id]) : null)
      .filter(vote => vote !== null) as number[];

    if (voteValues.length === 0) return null;

    const average = voteValues.reduce((sum, vote) => sum + vote, 0) / voteValues.length;

    const closestVote = votingOptions
      .filter(option => typeof option === 'number')
      .reduce((prev, curr) => Math.abs(curr as number - average) < Math.abs(prev - average) ? curr : prev, votingOptions[0]);

    return closestVote;
  };

  const averageVote = calculateAverageVote();

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        {showVotes ? 'Votes' : 'Votes Hidden'}
      </Typography>

      {showVotes && averageVote !== null && (
        <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 2 }}>
          Average: {averageVote}
        </Typography>
      )}

      <List>
        <Grid container spacing={2}>
          {users.map((user) => (
            <Grid item xs={6} sm={4} md={3} key={user.id}>
              <Card variant="outlined" sx={{ backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {user.name}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {/* Show 'No vote' if the vote is null or undefined */}
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
      </List>
    </Paper>
  );
};

export default VotesDisplay;
