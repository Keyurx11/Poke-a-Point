import React from 'react';
import { Typography, Box } from '@mui/material';

interface RoomHeaderProps {
  roomId: string | undefined;
  roomName: string;
  userName: string;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ roomId, roomName, userName }) => (
  <Box sx={{ marginBottom: 4 }}>
    <Typography variant="h4" gutterBottom textAlign="center">
      {roomName}
    </Typography>
    <Typography variant="subtitle1" gutterBottom textAlign="center">
      Room ID: {roomId}
    </Typography>
    <Typography variant="subtitle2" gutterBottom textAlign="center">
      Welcome, {userName}
    </Typography>
  </Box>
);

export default RoomHeader;
