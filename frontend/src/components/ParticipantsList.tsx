// src/components/ParticipantsList.tsx

import React from 'react';
import { List, ListItem, ListItemText, Typography, Paper } from '@mui/material';

interface ParticipantsListProps {
  users: { id: string; name: string }[];
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ users }) => (
  <Paper sx={{ padding: 2 }}>
    <Typography variant="h6" gutterBottom>
      Participants
    </Typography>
    <List>
      {users.map((user) => (
        <ListItem key={user.id}>
          <ListItemText primary={user.name} />
        </ListItem>
      ))}
    </List>
  </Paper>
);

export default ParticipantsList;
