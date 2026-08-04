// src/components/RoomHeader.tsx

import React from 'react';
import { Typography, Box, Chip } from '@mui/material';

interface RoomHeaderProps {
  roomId: string | undefined;
  roomName: string;
  userName: string;
  isCreator?: boolean;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ roomId, roomName, userName, isCreator }) => (
  <Box sx={{ mb: 3, textAlign: 'center' }}>
    <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} mb={1}>
      <Typography variant="h4" fontWeight="bold" color="textPrimary">
        {roomName || 'Estimation Session'}
      </Typography>
      {isCreator && (
        <Chip label="Session Host" color="primary" size="small" sx={{ fontWeight: 'bold' }} />
      )}
    </Box>
    <Typography variant="subtitle2" color="textSecondary" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
      ROOM CODE: <strong>{roomId}</strong>
    </Typography>
    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
      Logged in as <strong>{userName}</strong>
    </Typography>
  </Box>
);

export default RoomHeader;
