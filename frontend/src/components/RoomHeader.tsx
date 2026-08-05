// src/components/RoomHeader.tsx

import React, { useState } from 'react';
import { Paper, Box, Typography, Chip, Button, Snackbar, Alert, Tooltip, Switch } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface RoomHeaderProps {
  roomId: string | undefined;
  roomName: string;
  userName: string;
  isCreator?: boolean;
  isObserver?: boolean;
  handleToggleRole?: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ roomId, roomName, userName, isCreator, isObserver, handleToggleRole }) => {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/join?roomId=${roomId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        py: 1,
        px: 2,
        mb: 1.5,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.12)',
      }}
    >
      {/* Left side: Room Name & Host Badge */}
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" flex={1} justifyContent="flex-start">
        <Typography variant="subtitle1" fontWeight="bold" sx={{ letterSpacing: '-0.01em', color: '#FFFFFF', fontSize: '1rem' }}>
          {roomName || 'Estimation Session'}
        </Typography>
        {isCreator && (
          <Tooltip title="Session Host" arrow>
            <Chip
              data-testid="host-badge"
              aria-label="Session Host"
              label="H"
              color="primary"
              size="small"
              sx={{ fontWeight: 'bold', height: 20, fontSize: '0.675rem', backgroundColor: '#3B82F6', minWidth: 20, px: 0.5 }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Center: Interactive Room Code + Copy Pill */}
      <Box display="flex" justifyContent="center" flex={1}>
        <Tooltip title="Click to copy invite link" arrow>
          <Chip
            data-testid="room-code-chip"
            icon={<ContentCopyIcon sx={{ fontSize: '0.85rem !important', color: '#60A5FA !important' }} />}
            label={`Invite Link: ${roomId}`}
            variant="outlined"
            onClick={copyUrl}
            sx={{
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: '#60A5FA',
              borderColor: 'rgba(96, 165, 250, 0.4)',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              fontSize: '0.8rem',
              height: 28,
              px: 1,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                borderColor: '#60A5FA',
                transform: 'scale(1.02)',
              },
            }}
          />
        </Tooltip>
      </Box>

      {/* Right side: Logged in user & Observer toggle */}
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        flexWrap="wrap"
        flex={1}
        justifyContent={{ xs: 'center', md: 'flex-end' }}
      >
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
          Logged in as <strong style={{ color: '#34D399' }}>{userName}</strong>
        </Typography>

        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="caption" sx={{ color: isObserver ? '#FBBF24' : 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: '0.725rem', userSelect: 'none' }}>
            Observer
          </Typography>
          <Switch
            checked={!!isObserver}
            onChange={handleToggleRole}
            size="small"
            inputProps={{ 'data-testid': 'observer-toggle' } as React.InputHTMLAttributes<HTMLInputElement>}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#FBBF24',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#FBBF24',
              },
              '& .MuiSwitch-track': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              },
            }}
          />
        </Box>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopied(false)} severity="success" sx={{ width: '100%' }}>
          Room invite link copied to clipboard!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default RoomHeader;
