// src/components/RoomHeader.tsx

import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Snackbar,
  Alert,
  Tooltip,
  Switch,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

interface RoomHeaderProps {
  roomId: string | undefined;
  roomName: string;
  userName: string;
  isCreator?: boolean;
  isObserver?: boolean;
  handleToggleRole?: () => void;
  handleResetVotes?: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomId,
  roomName,
  userName,
  isCreator,
  isObserver,
  handleToggleRole,
  handleResetVotes,
}) => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [copied, setCopied] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const inviteUrl = `${window.location.origin}/join?roomId=${roomId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLeaveRoom = () => {
    handleMenuClose();
    if (socket && roomId) {
      socket.emit('leaveRoom', { roomId });
    }
    navigate('/');
  };

  const handleEndSession = () => {
    handleMenuClose();
    if (socket && roomId) {
      socket.emit('endSession', { roomId });
    }
    navigate('/');
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
      {/* Left side: Room Name */}
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" flex={1} justifyContent="flex-start">
        <Typography variant="subtitle1" fontWeight="bold" sx={{ letterSpacing: '-0.01em', color: '#FFFFFF', fontSize: '1rem' }}>
          {roomName || 'Estimation Session'}
        </Typography>
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

      {/* Right side: Logged in user avatar menu & Observer toggle */}
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        flexWrap="wrap"
        flex={1}
        justifyContent={{ xs: 'center', md: 'flex-end' }}
      >
        <Chip
          data-testid="user-profile-chip"
          avatar={
            <Avatar sx={{ bgcolor: '#3B82F6', color: '#ffffff', fontWeight: 'bold', fontSize: '0.75rem', width: 24, height: 24 }}>
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          }
          label={userName}
          onDelete={handleMenuOpen}
          deleteIcon={<KeyboardArrowDownIcon sx={{ color: 'rgba(255,255,255,0.7) !important', fontSize: '1rem !important' }} />}
          onClick={handleMenuOpen}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            height: 30,
            pl: 0.5,
            pr: 0.5,
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        />

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 4,
            sx: {
              mt: 1,
              borderRadius: 2,
              minWidth: 160,
              bgcolor: '#1E293B',
              color: '#FFFFFF',
              border: '1px solid #334155',
            },
          }}
        >
          <MenuItem onClick={handleLeaveRoom} sx={{ py: 1, '&:hover': { bgcolor: '#334155' } }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: '#F87171' }} />
            </ListItemIcon>
            <ListItemText primary="Leave Room" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#F87171' }} />
          </MenuItem>
          {isCreator && (
            <MenuItem onClick={handleEndSession} sx={{ py: 1, '&:hover': { bgcolor: '#334155' } }}>
              <ListItemIcon>
                <HighlightOffIcon fontSize="small" sx={{ color: '#FBBF24' }} />
              </ListItemIcon>
              <ListItemText primary="End Session" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FBBF24' }} />
            </MenuItem>
          )}
        </Menu>

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
